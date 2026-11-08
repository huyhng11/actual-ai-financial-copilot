import crypto from 'node:crypto';

import cors from 'cors';
import express from 'express';
import type { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';

import { requestLoggerMiddleware } from './util/middlewares';

export type QueuedWebhookItem = {
  id: string;
  kind: 'techcombank' | 'social-chat';
  channel: string;
  receivedAt: string;
  referenceId: string;
  transactionDate: string;
  amountVnd?: number;
  rawText: string;
  scrubbedText: string;
  piiRedactedCount: number;
  accountHint: string;
};

const MAX_QUEUE_SIZE = 200;
const webhookQueue = new Map<string, QueuedWebhookItem>();

function scrubServerPii(input: string): {
  scrubbedText: string;
  redactedCount: number;
} {
  let redactedCount = 0;
  const withoutEmails = input.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    () => {
      redactedCount += 1;
      return '[REDACTED_EMAIL]';
    },
  );
  const withoutAcctNums = withoutEmails.replace(/\b\d{8,19}\b/g, () => {
    redactedCount += 1;
    return '[REDACTED_ACCT]';
  });
  return {
    scrubbedText: withoutAcctNums,
    redactedCount,
  };
}

function verifyHmacSignature(req: Request): boolean {
  const secret = process.env.ACTUAL_WEBHOOK_SECRET;
  if (!secret) {
    // When no secret is configured in local development, allow localhost testing
    return true;
  }

  const signatureHeader = req.get('X-Actual-Signature') ?? '';
  if (!signatureHeader.startsWith('sha256=')) {
    return false;
  }

  const providedHex = signatureHeader.slice('sha256='.length).trim();
  const expectedHex = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(req.body ?? {}))
    .digest('hex');

  const providedBuf = Buffer.from(providedHex, 'utf8');
  const expectedBuf = Buffer.from(expectedHex, 'utf8');
  if (providedBuf.length !== expectedBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(providedBuf, expectedBuf);
}

function enqueueWebhookItem(item: QueuedWebhookItem): {
  queued: boolean;
  duplicate: boolean;
} {
  if (webhookQueue.has(item.id)) {
    return { queued: false, duplicate: true };
  }

  if (webhookQueue.size >= MAX_QUEUE_SIZE) {
    const oldestKey = webhookQueue.keys().next().value;
    if (oldestKey) {
      webhookQueue.delete(oldestKey);
    }
  }

  webhookQueue.set(item.id, item);
  return { queued: true, duplicate: false };
}

const app = express();
export { app as handlers };

app.use(cors());
app.use(express.json({ limit: '256kb' }));
app.use(requestLoggerMiddleware);
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    legacyHeaders: false,
    standardHeaders: true,
  }),
);

/**
 * POST /webhooks/v1/techcombank
 * Supports:
 * 1. Direct / iOS Shortcuts / Notification Forwarder format:
 *    { referenceId, transactionDate, amountVnd, description, accountNumberHint }
 * 2. SePay.vn VietQR format:
 *    { id, referenceCode, transactionDate, transferAmount, transferType: 'in'|'out', content }
 * 3. Casso.vn format:
 *    { data: [{ tid, when, amount, description, subAccId }] }
 */
app.post('/techcombank', (req: Request, res: Response) => {
  if (!verifyHmacSignature(req)) {
    res.status(401).json({
      status: 'error',
      reason: 'invalid-hmac-signature',
    });
    return;
  }

  const body = (req.body ?? {}) as Record<string, unknown>;
  const today = new Date().toISOString().slice(0, 10);

  // Normalize Casso array if present
  const records: Array<Record<string, unknown>> = Array.isArray(body.data)
    ? (body.data as Array<Record<string, unknown>>)
    : [body];

  const results: Array<{ id: string; duplicate: boolean }> = [];

  for (const record of records) {
    const referenceId = String(
      record.referenceId ??
        record.referenceCode ??
        record.tid ??
        record.id ??
        `TCB-${Date.now()}`,
    );
    const rawDate = String(
      record.transactionDate ?? record.when ?? today,
    ).slice(0, 10);

    let amountVnd = Number(
      record.amountVnd ?? record.transferAmount ?? record.amount ?? 0,
    );
    if (
      record.transferType === 'out' &&
      Number.isFinite(amountVnd) &&
      amountVnd > 0
    ) {
      amountVnd = -amountVnd;
    }

    const rawDescription = String(
      record.description ?? record.content ?? 'Techcombank VietQR Transaction',
    );
    const accountHint = String(
      record.accountNumberHint ?? record.subAccId ?? 'Techcombank',
    );

    if (!Number.isFinite(amountVnd) || amountVnd === 0) {
      continue;
    }

    const { scrubbedText, redactedCount } = scrubServerPii(rawDescription);
    const id = `tcb:${referenceId}:${rawDate}:${amountVnd}`;

    const outcome = enqueueWebhookItem({
      id,
      kind: 'techcombank',
      channel: 'techcombank-vietqr',
      receivedAt: new Date().toISOString(),
      referenceId,
      transactionDate: rawDate,
      amountVnd,
      rawText: rawDescription,
      scrubbedText,
      piiRedactedCount: redactedCount,
      accountHint,
    });

    results.push({ id, duplicate: outcome.duplicate });
  }

  res.status(200).json({
    status: 'ok',
    processed: results.length,
    results,
  });
});

/**
 * POST /webhooks/v1/social-chat
 * Supports:
 * 1. Direct JSON from custom bot / n8n / Make:
 *    { channel: 'messenger' | 'instagram' | 'telegram', messageId, text, accountHint }
 * 2. Telegram Bot Webhook format:
 *    { update_id, message: { message_id, text } }
 * 3. Meta Messenger / Instagram Webhook format:
 *    { object: 'page' | 'instagram', entry: [{ messaging: [{ message: { mid, text } }] }] }
 */
app.post('/social-chat', (req: Request, res: Response) => {
  if (!verifyHmacSignature(req)) {
    res.status(401).json({
      status: 'error',
      reason: 'invalid-hmac-signature',
    });
    return;
  }

  const body = (req.body ?? {}) as Record<string, unknown>;
  const today = new Date().toISOString().slice(0, 10);

  let channel = String(body.channel ?? 'social-bot');
  let messageId = String(body.messageId ?? '');
  let text = String(body.text ?? '');
  const accountHint = String(body.accountHint ?? 'Techcombank');

  // Telegram Bot API format
  if (!text && typeof body.message === 'object' && body.message !== null) {
    const tgMsg = body.message as Record<string, unknown>;
    channel = 'telegram';
    messageId = String(tgMsg.message_id ?? body.update_id ?? Date.now());
    text = String(tgMsg.text ?? '');
  }

  // Meta Messenger / Instagram Graph Webhook format
  if (!text && Array.isArray(body.entry) && body.entry.length > 0) {
    const firstEntry = body.entry[0] as Record<string, unknown>;
    const messaging = Array.isArray(firstEntry?.messaging)
      ? (firstEntry.messaging[0] as Record<string, unknown>)
      : null;
    const msgObj =
      messaging && typeof messaging.message === 'object'
        ? (messaging.message as Record<string, unknown>)
        : null;
    if (msgObj) {
      channel = body.object === 'instagram' ? 'instagram' : 'messenger';
      messageId = String(msgObj.mid ?? Date.now());
      text = String(msgObj.text ?? '');
    }
  }

  if (!text.trim()) {
    res.status(400).json({
      status: 'error',
      reason: 'empty-message-text',
    });
    return;
  }

  if (!messageId) {
    messageId = `msg-${Date.now()}`;
  }

  const { scrubbedText, redactedCount } = scrubServerPii(text);
  const id = `chat:${channel}:${messageId}`;

  const outcome = enqueueWebhookItem({
    id,
    kind: 'social-chat',
    channel,
    receivedAt: new Date().toISOString(),
    referenceId: messageId,
    transactionDate: today,
    rawText: text,
    scrubbedText,
    piiRedactedCount: redactedCount,
    accountHint,
  });

  res.status(200).json({
    status: 'ok',
    id,
    channel,
    duplicate: outcome.duplicate,
    scrubbedText,
  });
});

/**
 * GET /webhooks/v1/queue
 * Returns all pending Techcombank & Social Chatbot webhook items so the client
 * can review and commit them into the local SQLite/CRDT ledger.
 */
app.get('/queue', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    items: Array.from(webhookQueue.values()),
  });
});

/**
 * POST /webhooks/v1/queue/ack
 * Removes processed webhook IDs from the queue.
 */
app.post('/queue/ack', (req: Request, res: Response) => {
  const body = (req.body ?? {}) as { ids?: unknown };
  const ids = Array.isArray(body.ids) ? body.ids : [];
  let removed = 0;
  for (const id of ids) {
    if (typeof id === 'string' && webhookQueue.delete(id)) {
      removed += 1;
    }
  }
  res.status(200).json({
    status: 'ok',
    removed,
  });
});

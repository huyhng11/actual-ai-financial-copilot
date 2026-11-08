import { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { Input } from '@actual-app/components/input';
import { styles } from '@actual-app/components/styles';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';
import { send } from '@actual-app/core/platform/client/connection';

import { OPEN_AI_COPILOT_EVENT } from '#components/budget/ExecutivePulseBar';
import { FinancialText } from '#components/FinancialText';
import { useAccounts } from '#hooks/useAccounts';
import { useCategories } from '#hooks/useCategories';
import { useFormat } from '#hooks/useFormat';

import {
  answerReadOnlyFinancialQuery,
  parseNaturalLanguageTransaction,
  parseTechcombankWebhook,
  TIER_2_SANITY_CAP_MAJOR,
} from './copilotEngine';
import type {
  CopilotReadOnlyInsight,
  CopilotTransactionProposal,
  TechcombankWebhookPayload,
} from './copilotTypes';

const SAMPLE_PROMPTS: ReadonlyArray<{
  label: string;
  prompt: string;
}> = [
  {
    label: '📊 Tier 1: Local RAG Summary',
    prompt: 'Tổng danh sách tài khoản & danh mục RAG hiện tại?',
  },
  {
    label: '🍜 Ăn phở 55k (TCB)',
    prompt: 'Ăn phở 55k bằng Techcombank STK 19038475629102',
  },
  {
    label: '☕ Cafe Highlands 65k',
    prompt: 'Cafe Highlands 65k bằng Techcombank',
  },
  {
    label: '🛒 Siêu thị WinMart 450k',
    prompt: 'Đi siêu thị WinMart 450k bằng Checking',
  },
  {
    label: '💰 Lương +25tr (Tier 3 HITL)',
    prompt: 'Lương về +25tr vào Techcombank',
  },
];

const SAMPLE_TCB_WEBHOOKS: ReadonlyArray<{
  title: string;
  payload: TechcombankWebhookPayload;
}> = [
  {
    title: 'TCB VietQR Outflow (-55,000 VND • Phở Thìn)',
    payload: {
      referenceId: 'FT26311982341',
      transactionDate: new Date().toISOString().slice(0, 10),
      amountVnd: -55_000,
      description: 'PHAM MINH TUAN chuyen tien an pho STK 19038475629102',
      accountNumberHint: 'Techcombank',
    },
  },
  {
    title: 'TCB VietQR Outflow (-185,000 VND • Grab)',
    payload: {
      referenceId: 'FT26311989912',
      transactionDate: new Date().toISOString().slice(0, 10),
      amountVnd: -185_000,
      description: 'Thanh toan chuyen xe GrabCar TK 19038475629102',
      accountNumberHint: 'Techcombank',
    },
  },
  {
    title: 'TCB Payroll Inflow (+28,500,000 VND • Tier 3 HITL)',
    payload: {
      referenceId: 'FT26311995001',
      transactionDate: new Date().toISOString().slice(0, 10),
      amountVnd: 28_500_000,
      description: 'CONG TY TNHH CONG NGHE thanh toan luong thang 11',
      accountNumberHint: 'Techcombank',
    },
  },
];

export function AICopilotDrawer() {
  const { t } = useTranslation();
  const format = useFormat();
  const { data: accounts = [] } = useAccounts();
  const { data: { list: categories = [] } = { list: [] } } = useCategories();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'copilot' | 'techcombank'>(
    'copilot',
  );
  const [inputText, setInputText] = useState('');
  const [proposals, setProposals] = useState<CopilotTransactionProposal[]>([]);
  const [readOnlyInsights, setReadOnlyInsights] = useState<
    CopilotReadOnlyInsight[]
  >([]);
  const [recordedImportedIds, setRecordedImportedIds] = useState<
    ReadonlySet<string>
  >(() => new Set());
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    function handleOpenEvent() {
      setIsOpen(true);
    }

    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }

    window.addEventListener(OPEN_AI_COPILOT_EVENT, handleOpenEvent);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener(OPEN_AI_COPILOT_EVENT, handleOpenEvent);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const openAccounts = accounts.filter(a => !a.closed);
  const activeCategories = categories.filter(c => !c.hidden);

  function handleParseInput(rawText: string) {
    const targetText = rawText.trim();
    if (!targetText) {
      return;
    }

    const ragContext = {
      accounts: openAccounts,
      categories: activeCategories,
      existingImportedIds: recordedImportedIds,
    };

    const proposal = parseNaturalLanguageTransaction(targetText, ragContext);

    if (proposal) {
      setStatusBanner(null);
      setProposals(prev => [
        proposal,
        ...prev.filter(p => p.id !== proposal.id),
      ]);
      setInputText('');
      return;
    }

    const insight = answerReadOnlyFinancialQuery(targetText, ragContext);
    if (insight) {
      setStatusBanner(null);
      setReadOnlyInsights(prev => [insight, ...prev.slice(0, 3)]);
      setInputText('');
      return;
    }

    setStatusBanner(
      t(
        'Could not extract an amount or target account. Try e.g. "Ăn phở 55k bằng Techcombank", "Coffee 65k", or ask "Tổng danh sách tài khoản?".',
      ),
    );
  }

  function handleSimulateWebhook(payload: TechcombankWebhookPayload) {
    const proposal = parseTechcombankWebhook(payload, {
      accounts: openAccounts,
      categories: activeCategories,
      existingImportedIds: recordedImportedIds,
    });

    if (!proposal) {
      setStatusBanner(
        t('Create at least one open account first to test Techcombank sync.'),
      );
      return;
    }

    setStatusBanner(null);
    setProposals(prev => [proposal, ...prev.filter(p => p.id !== proposal.id)]);
  }

  async function handlePullLiveServerQueue() {
    try {
      const response = await fetch('http://localhost:5006/webhooks/v1/queue');
      if (!response.ok) {
        setStatusBanner(
          t('Sync server queue returned status {{status}}', {
            status: response.status,
          }),
        );
        return;
      }

      const data = (await response.json()) as {
        items?: Array<{
          id: string;
          kind: 'techcombank' | 'social-chat';
          referenceId: string;
          transactionDate: string;
          amountVnd?: number;
          rawText: string;
          accountHint: string;
        }>;
      };

      const items = data.items ?? [];
      if (items.length === 0) {
        setStatusBanner(
          t(
            'No new items in localhost:5006/webhooks/v1/queue. Send a POST to /webhooks/v1/techcombank or /webhooks/v1/social-chat to test!',
          ),
        );
        return;
      }

      const newProposals: CopilotTransactionProposal[] = [];
      const ackIds: string[] = [];

      for (const item of items) {
        const proposal =
          item.kind === 'techcombank' && typeof item.amountVnd === 'number'
            ? parseTechcombankWebhook(
                {
                  referenceId: item.referenceId,
                  transactionDate: item.transactionDate,
                  amountVnd: item.amountVnd,
                  description: item.rawText,
                  accountNumberHint: item.accountHint,
                },
                {
                  accounts: openAccounts,
                  categories: activeCategories,
                  existingImportedIds: recordedImportedIds,
                },
              )
            : parseNaturalLanguageTransaction(item.rawText, {
                accounts: openAccounts,
                categories: activeCategories,
                existingImportedIds: recordedImportedIds,
              });

        if (proposal) {
          newProposals.push(proposal);
          ackIds.push(item.id);
        }
      }

      if (ackIds.length > 0) {
        await fetch('http://localhost:5006/webhooks/v1/queue/ack', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: ackIds }),
        });
      }

      setProposals(prev => {
        const existingIds = new Set(newProposals.map(p => p.id));
        return [...newProposals, ...prev.filter(p => !existingIds.has(p.id))];
      });
      setStatusBanner(
        t('Pulled {{count}} live webhook event(s) from Sync Server (:5006).', {
          count: newProposals.length,
        }),
      );
    } catch {
      setStatusBanner(
        t(
          'Could not reach localhost:5006/webhooks/v1/queue. Ensure yarn start:server is running.',
        ),
      );
    }
  }

  async function handleConfirmProposal(proposal: CopilotTransactionProposal) {
    if (isSubmitting || proposal.status === 'confirmed') {
      return;
    }

    if (recordedImportedIds.has(proposal.importedId)) {
      setProposals(prev =>
        prev.map(p =>
          p.id === proposal.id ? { ...p, status: 'duplicate' } : p,
        ),
      );
      setStatusBanner(
        t(
          'Blocked by Idempotency Guardrail: imported_id already recorded in this session.',
        ),
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const payeeId = await send('payee-create', {
        name: proposal.payeeName,
      });

      await send('transactions-batch-update', {
        added: [
          {
            id: crypto.randomUUID(),
            account: proposal.accountId,
            date: proposal.date,
            amount: proposal.amount,
            payee: payeeId,
            category: proposal.categoryId ?? undefined,
            notes: proposal.notes,
            imported_id: proposal.importedId,
            cleared: true,
          },
        ],
      });

      setRecordedImportedIds(prev => {
        const next = new Set(prev);
        next.add(proposal.importedId);
        return next;
      });

      setProposals(prev =>
        prev.map(p =>
          p.id === proposal.id ? { ...p, status: 'confirmed' } : p,
        ),
      );
      setStatusBanner(
        t(
          'Recorded into Actual SQLite/CRDT ledger! Press Cmd/Ctrl+Z anytime to undo.',
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleDismissProposal(id: string) {
    setProposals(prev => prev.filter(p => p.id !== id));
  }

  return (
    <View
      data-testid="ai-copilot-drawer"
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: 430,
        maxWidth: '94vw',
        backgroundColor: theme.cardBackground,
        borderLeft: `1px solid ${theme.tableBorder}`,
        boxShadow: styles.cardShadow,
        zIndex: 3500,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <View
        style={{
          padding: '14px 16px',
          borderBottom: `1px solid ${theme.tableBorder}`,
          backgroundColor: theme.tableBackground,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <View style={{ gap: 2 }}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: theme.pageText,
            }}
          >
            <Trans>AI Financial Copilot & Guardrails</Trans>
          </Text>
          <Text
            style={{
              fontSize: 11,
              color: theme.pageTextSubdued,
            }}
          >
            <Trans>
              Local RAG • PII Scrubber • 3-Tier HITL Protection • CRDT Undoable
            </Trans>
          </Text>
        </View>
        <Button
          variant="bare"
          onPress={() => setIsOpen(false)}
          style={{ padding: '4px 8px', fontSize: 12 }}
        >
          <Trans>Close (Esc)</Trans>
        </Button>
      </View>

      {/* Mode Switcher Tabs */}
      <View
        style={{
          flexDirection: 'row',
          padding: '8px 16px',
          gap: 8,
          borderBottom: `1px solid ${theme.tableBorder}`,
          backgroundColor: theme.pageBackground,
        }}
      >
        <Button
          variant={activeTab === 'copilot' ? 'primary' : 'normal'}
          onPress={() => setActiveTab('copilot')}
          style={{ flex: 1, fontSize: 12, padding: '6px 10px' }}
        >
          <Trans>Natural Language Copilot</Trans>
        </Button>
        <Button
          variant={activeTab === 'techcombank' ? 'primary' : 'normal'}
          onPress={() => setActiveTab('techcombank')}
          style={{ flex: 1, fontSize: 12, padding: '6px 10px' }}
        >
          <Trans>Techcombank & Bot Sync</Trans>
        </Button>
      </View>

      {/* Body */}
      <View
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 16,
          gap: 14,
        }}
      >
        {/* Active Guardrails & Local RAG Status Card */}
        <View
          style={{
            padding: 12,
            borderRadius: 8,
            backgroundColor: theme.tableBackground,
            border: `1px solid ${theme.tableBorder}`,
            gap: 6,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: theme.noticeTextLight,
            }}
          >
            <Trans>Spec Kit Agent-to-System Guardrails Active</Trans>
          </Text>
          <Text style={{ fontSize: 12, color: theme.pageTextSubdued }}>
            <Trans>
              • Local RAG Context: {{ acctCount: openAccounts.length }} open
              accounts & {{ catCount: activeCategories.length }} budget
              categories indexed in-memory (0 external vector DBs).
            </Trans>
          </Text>
          <Text style={{ fontSize: 12, color: theme.pageTextSubdued }}>
            <Trans>
              • PII Scrubber: Automatically masks 8–19 digit account/card
              numbers and emails before parsing.
            </Trans>
          </Text>
          <FinancialText style={{ fontSize: 12, color: theme.pageTextSubdued }}>
            <Trans>
              • Tier 2 Sanity Cap:{' '}
              {{ cap: TIER_2_SANITY_CAP_MAJOR.toLocaleString() }} (higher
              amounts trigger Tier 3 HITL warning).
            </Trans>
          </FinancialText>
        </View>

        {activeTab === 'copilot' ? (
          <View style={{ gap: 10 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: theme.pageText,
              }}
            >
              <Trans>
                Enter an expense or income in Vietnamese or English:
              </Trans>
            </Text>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Input
                value={inputText}
                placeholder={t(
                  'e.g. Ăn phở 55k bằng Techcombank or Lương +25tr',
                )}
                onChangeValue={setInputText}
                onEnter={() => handleParseInput(inputText)}
                style={{ flex: 1 }}
              />
              <Button
                variant="primary"
                onPress={() => handleParseInput(inputText)}
              >
                <Trans>Parse</Trans>
              </Button>
            </View>

            {/* Quick Prompt Chips */}
            <View style={{ gap: 6 }}>
              <Text
                style={{
                  fontSize: 11,
                  color: theme.pageTextSubdued,
                  fontWeight: 600,
                }}
              >
                <Trans>One-click test prompts:</Trans>
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: 6,
                }}
              >
                {SAMPLE_PROMPTS.map(sample => (
                  <Button
                    key={sample.label}
                    variant="normal"
                    onPress={() => handleParseInput(sample.prompt)}
                    style={{
                      fontSize: 11,
                      padding: '4px 8px',
                      borderRadius: 999,
                    }}
                  >
                    {sample.label}
                  </Button>
                ))}
              </View>
            </View>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            <View
              style={{
                padding: 12,
                borderRadius: 8,
                backgroundColor: theme.tableBackground,
                border: `1px solid ${theme.tableBorder}`,
                gap: 6,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: theme.pageText,
                }}
              >
                <Trans>
                  Techcombank (VietQR / Casso / SePay) & Social Bot Bridge
                </Trans>
              </Text>
              <Text style={{ fontSize: 12, color: theme.pageTextSubdued }}>
                <Trans>
                  Simulate incoming Techcombank balance notifications or
                  Messenger/Telegram chatbot webhooks, or pull live webhook
                  events from the Sync Server (:5006). Every payload is
                  deduplicated using a deterministic imported_id
                  (tcb:ref:date:amount).
                </Trans>
              </Text>
              <Button
                variant="primary"
                onPress={() => {
                  void handlePullLiveServerQueue();
                }}
                style={{
                  marginTop: 4,
                  fontSize: 12,
                  padding: '6px 10px',
                }}
              >
                <Trans>
                  🔄 Pull Live Webhooks from Sync Server (localhost:5006)
                </Trans>
              </Button>
            </View>

            <View style={{ gap: 8 }}>
              {SAMPLE_TCB_WEBHOOKS.map(item => (
                <Button
                  key={item.payload.referenceId}
                  variant="normal"
                  onPress={() => handleSimulateWebhook(item.payload)}
                  style={{
                    justifyContent: 'flex-start',
                    padding: '8px 10px',
                    fontSize: 12,
                  }}
                >
                  {item.title}
                </Button>
              ))}
            </View>
          </View>
        )}

        {/* Status Banner */}
        {statusBanner && (
          <View
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              backgroundColor: theme.pillBackground,
              border: `1px solid ${theme.tableBorder}`,
            }}
          >
            <Text style={{ fontSize: 12, color: theme.pageText }}>
              {statusBanner}
            </Text>
          </View>
        )}

        {/* Tier 1 Read-Only Financial RAG Insight Cards */}
        {readOnlyInsights.map(insight => (
          <View
            key={insight.id}
            style={{
              padding: 12,
              borderRadius: 10,
              backgroundColor: theme.tableBackground,
              border: `1px solid ${theme.tableBorder}`,
              gap: 6,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 6,
              }}
            >
              <View
                style={{
                  padding: '2px 8px',
                  borderRadius: 999,
                  backgroundColor: theme.pillBackground,
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: theme.noticeTextLight,
                  }}
                >
                  <Trans>TIER 1 • READ-ONLY ANALYTICS (0 DB WRITES)</Trans>
                </Text>
              </View>
              <Button
                variant="bare"
                onPress={() =>
                  setReadOnlyInsights(prev =>
                    prev.filter(i => i.id !== insight.id),
                  )
                }
                style={{ fontSize: 11, padding: '2px 6px' }}
              >
                <Trans>Dismiss</Trans>
              </Button>
            </View>
            <Text
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: theme.pageText,
              }}
            >
              {insight.summaryTitle}
            </Text>
            <Text style={{ fontSize: 11, color: theme.pageTextSubdued }}>
              <Trans>Scrubbed Query: {{ query: insight.scrubbedQuery }}</Trans>
            </Text>
            {insight.details.map(line => (
              <Text
                key={line}
                style={{ fontSize: 12, color: theme.pageTextSubdued }}
              >
                {`• ${line}`}
              </Text>
            ))}
          </View>
        ))}

        {/* HITL Transaction Preview Cards */}
        <View style={{ gap: 10 }}>
          {proposals.map(proposal => {
            const isTier3 = proposal.guardrailTier === 3;
            const isConfirmed = proposal.status === 'confirmed';
            const isDuplicate = proposal.status === 'duplicate';

            return (
              <View
                key={proposal.id}
                style={{
                  padding: 12,
                  borderRadius: 10,
                  backgroundColor: theme.tableBackground,
                  border: `1px solid ${
                    isTier3 ? theme.warningText : theme.tableBorder
                  }`,
                  gap: 8,
                }}
              >
                {/* Top Badges */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 6,
                    flexWrap: 'wrap',
                  }}
                >
                  <View
                    style={{
                      padding: '2px 8px',
                      borderRadius: 999,
                      backgroundColor: theme.pillBackground,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: isTier3
                          ? theme.warningText
                          : theme.noticeTextLight,
                      }}
                    >
                      {isTier3 ? (
                        <Trans>TIER 3 • HIGH-VALUE HITL GUARDRAIL</Trans>
                      ) : (
                        <Trans>TIER 2 • GUARDRAILED WRITE</Trans>
                      )}
                    </Text>
                  </View>

                  {proposal.piiRedactedCount > 0 && (
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: theme.noticeTextLight,
                      }}
                    >
                      <Trans>
                        🔒 PII Scrubbed ({{ count: proposal.piiRedactedCount }})
                      </Trans>
                    </Text>
                  )}
                </View>

                {/* Payee & Formatted Integer Amount */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: theme.pageText,
                    }}
                  >
                    {proposal.payeeName}
                  </Text>
                  <FinancialText
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color:
                        proposal.amount < 0
                          ? theme.errorText
                          : theme.noticeTextLight,
                      ...styles.tnum,
                    }}
                  >
                    {format(proposal.amount, 'financial')}
                  </FinancialText>
                </View>

                {/* Matched RAG Account, Category & Idempotency Key */}
                <View style={{ gap: 3 }}>
                  <Text style={{ fontSize: 12, color: theme.pageTextSubdued }}>
                    <Trans>
                      Account (RAG): {{ accountName: proposal.accountName }} •
                      Category: {{ categoryName: proposal.categoryName }}
                    </Trans>
                  </Text>
                  <Text style={{ fontSize: 11, color: theme.pageTextSubdued }}>
                    <Trans>Scrubbed Note: {{ notes: proposal.notes }}</Trans>
                  </Text>
                  <FinancialText
                    style={{ fontSize: 10, color: theme.pageTextSubdued }}
                  >
                    {`imported_id: ${proposal.importedId}`}
                  </FinancialText>
                </View>

                <Text
                  style={{
                    fontSize: 11,
                    color: isTier3 ? theme.warningText : theme.pageTextSubdued,
                  }}
                >
                  {proposal.guardrailReason}
                </Text>

                {/* Action Buttons */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: 8,
                    marginTop: 4,
                  }}
                >
                  <Button
                    variant="bare"
                    onPress={() => handleDismissProposal(proposal.id)}
                    style={{ fontSize: 12 }}
                  >
                    <Trans>Dismiss</Trans>
                  </Button>
                  <Button
                    variant="primary"
                    isDisabled={isConfirmed || isDuplicate || isSubmitting}
                    onPress={() => {
                      void handleConfirmProposal(proposal);
                    }}
                    style={{ fontSize: 12, padding: '5px 12px' }}
                  >
                    {isConfirmed ? (
                      <Trans>✓ Recorded in Ledger</Trans>
                    ) : isDuplicate ? (
                      <Trans>Duplicate Blocked</Trans>
                    ) : (
                      <Trans>Confirm & Record</Trans>
                    )}
                  </Button>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

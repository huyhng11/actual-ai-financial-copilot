import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { styles } from '@actual-app/components/styles';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';

import { FinancialText } from '#components/FinancialText';
import { CellValue, CellValueText } from '#components/spreadsheet/CellValue';
import { useAccounts } from '#hooks/useAccounts';
import { useCategories } from '#hooks/useCategories';
import { useSheetValue } from '#hooks/useSheetValue';
import {
  allAccountBalance,
  envelopeBudget,
  offBudgetAccountBalance,
  onBudgetAccountBalance,
} from '#spreadsheet/bindings';

export const OPEN_AI_COPILOT_EVENT = 'actual:open-ai-copilot';

export function triggerOpenAICopilot() {
  window.dispatchEvent(new CustomEvent(OPEN_AI_COPILOT_EVENT));
}

export function ExecutivePulseBar() {
  const { t } = useTranslation();
  const { data: accounts = [] } = useAccounts();
  const { data: { list: categories = [] } = { list: [] } } = useCategories();

  const totalBudgetedRaw = useSheetValue<'envelope-budget', 'total-budgeted'>(
    envelopeBudget.totalBudgeted,
  );
  const totalSpentRaw = useSheetValue<'envelope-budget', 'total-spent'>(
    envelopeBudget.totalSpent,
  );

  const budgetedNum =
    typeof totalBudgetedRaw === 'number' ? Math.max(0, totalBudgetedRaw) : 0;
  const spentAbsNum =
    typeof totalSpentRaw === 'number'
      ? Math.abs(Math.min(0, totalSpentRaw))
      : 0;

  const utilizationRatio =
    budgetedNum > 0
      ? Math.min(1.5, spentAbsNum / budgetedNum)
      : spentAbsNum > 0
        ? 1
        : 0;
  const utilizationPercent = Math.round(utilizationRatio * 100);

  const utilizationColor =
    utilizationPercent > 100
      ? theme.errorText
      : utilizationPercent >= 85
        ? theme.warningText
        : theme.noticeTextLight;

  const openAccountsCount = accounts.filter(a => !a.closed).length;
  const activeCategoriesCount = categories.filter(c => !c.hidden).length;

  return (
    <View
      data-testid="executive-pulse-bar"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '8px 14px',
        marginBottom: 6,
        marginTop: 4,
        borderRadius: 10,
        backgroundColor: theme.tableBackground,
        border: `1px solid ${theme.tableBorder}`,
        boxShadow: styles.cardShadow,
        flexWrap: 'wrap',
        flexShrink: 0,
      }}
    >
      {/* Left: UXDA Executive Wealth & Liquidity Metrics */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 18,
          flexWrap: 'wrap',
        }}
      >
        {/* Metric 1: Total Net Worth */}
        <View style={{ gap: 2 }}>
          <Text
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: theme.pageTextSubdued,
            }}
          >
            <Trans>Net Worth</Trans>
          </Text>
          <CellValue<'account', 'accounts-balance'>
            binding={allAccountBalance()}
            type="financial"
          >
            {props => (
              <CellValueText
                {...props}
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: theme.pageTextPositive,
                  ...styles.tnum,
                }}
              />
            )}
          </CellValue>
        </View>

        <View
          style={{
            width: 1,
            height: 26,
            backgroundColor: theme.tableBorder,
          }}
        />

        {/* Metric 2: On-Budget Liquid Cash */}
        <View style={{ gap: 2 }}>
          <Text
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: theme.pageTextSubdued,
            }}
          >
            <Trans>Liquid Cash (On-Budget)</Trans>
          </Text>
          <CellValue<'account', 'onbudget-accounts-balance'>
            binding={onBudgetAccountBalance()}
            type="financial"
          >
            {props => (
              <CellValueText
                {...props}
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: theme.pageText,
                  ...styles.tnum,
                }}
              />
            )}
          </CellValue>
        </View>

        <View
          style={{
            width: 1,
            height: 26,
            backgroundColor: theme.tableBorder,
          }}
        />

        {/* Metric 3: Off-Budget / Investment Assets */}
        <View style={{ gap: 2 }}>
          <Text
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: theme.pageTextSubdued,
            }}
          >
            <Trans>Off-Budget Assets</Trans>
          </Text>
          <CellValue<'account', 'offbudget-accounts-balance'>
            binding={offBudgetAccountBalance()}
            type="financial"
          >
            {props => (
              <CellValueText
                {...props}
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: theme.pageTextSubdued,
                  ...styles.tnum,
                }}
              />
            )}
          </CellValue>
        </View>

        <View
          style={{
            width: 1,
            height: 26,
            backgroundColor: theme.tableBorder,
          }}
        />

        {/* Metric 4: Monthly Budget Utilization Gauge */}
        <View style={{ minWidth: 150, gap: 4 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: theme.pageTextSubdued,
              }}
            >
              <Trans>Month Utilization</Trans>
            </Text>
            <FinancialText
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: utilizationColor,
                ...styles.tnum,
              }}
            >
              {`${utilizationPercent}%`}
            </FinancialText>
          </View>
          <View
            style={{
              height: 5,
              width: '100%',
              backgroundColor: theme.pillBackground,
              borderRadius: 999,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                height: '100%',
                width: `${Math.min(100, utilizationPercent)}%`,
                backgroundColor: utilizationColor,
                borderRadius: 999,
                transition: 'width 200ms ease-out',
              }}
            />
          </View>
        </View>
      </View>

      {/* Right: Local RAG Status Pill & AI Copilot + Techcombank Sync Trigger */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 999,
            backgroundColor: theme.pillBackground,
            border: `1px solid ${theme.tableBorder}`,
          }}
          title={t(
            'Local Financial RAG indexes your accounts and categories in-memory with zero external vector DB',
          )}
        >
          <View
            style={{
              width: 7,
              height: 7,
              borderRadius: 999,
              backgroundColor: theme.noticeTextLight,
            }}
          />
          <FinancialText
            style={{
              fontSize: 11,
              color: theme.pageTextSubdued,
              fontWeight: 500,
            }}
          >
            <Trans>
              RAG Ready ({{ openAccountsCount }} accts •{' '}
              {{ activeCategoriesCount }} cats)
            </Trans>
          </FinancialText>
        </View>

        <Button
          variant="primary"
          onPress={triggerOpenAICopilot}
          style={{
            padding: '6px 12px',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 12,
          }}
        >
          <Trans>AI Copilot & Techcombank Sync (⌘J)</Trans>
        </Button>
      </View>
    </View>
  );
}

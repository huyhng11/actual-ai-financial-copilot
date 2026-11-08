import React from 'react';
import { useTranslation } from 'react-i18next';

import { SvgAdd } from '@actual-app/components/icons/v1';
import { View } from '@actual-app/components/view';

import { OPEN_AI_COPILOT_EVENT } from '#components/budget/ExecutivePulseBar';
import { useGlobalPref } from '#hooks/useGlobalPref';
import { replaceModal } from '#modals/modalsSlice';
import { useDispatch } from '#redux';

import { Accounts } from './Accounts';
import { BudgetName } from './BudgetName';
import { PrimaryButtons } from './PrimaryButtons';
import { SecondaryButtons } from './SecondaryButtons';
import { useSidebar } from './SidebarProvider';
import { SidebarShell } from './SidebarShell';
import { ToggleButton } from './ToggleButton';

export function Sidebar() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const sidebar = useSidebar();
  const [isFloating = false, setFloatingSidebarPref] =
    useGlobalPref('floatingSidebar');

  const onFloat = () => {
    setFloatingSidebarPref(!isFloating);
  };

  const onAddAccount = () => {
    dispatch(replaceModal({ modal: { name: 'add-account', options: {} } }));
  };

  const onOpenAiCopilot = () => {
    window.dispatchEvent(new CustomEvent(OPEN_AI_COPILOT_EVENT));
  };

  return (
    <SidebarShell>
      <BudgetName>
        {!sidebar.alwaysFloats && (
          <ToggleButton isFloating={isFloating} onFloat={onFloat} />
        )}
      </BudgetName>

      <View
        style={{
          flexGrow: 1,
          '@media screen and (max-height: 480px)': {
            overflowY: 'auto',
          },
        }}
      >
        <PrimaryButtons />

        <Accounts />

        <SecondaryButtons
          buttons={[
            {
              title: t('Add account'),
              Icon: SvgAdd,
              onClick: onAddAccount,
              dataTestId: 'sidebar-add-account',
            },
            {
              title: t('AI Copilot (⌘J)'),
              Icon: SvgAdd,
              onClick: onOpenAiCopilot,
              dataTestId: 'sidebar-ai-copilot',
            },
          ]}
        />
      </View>
    </SidebarShell>
  );
}

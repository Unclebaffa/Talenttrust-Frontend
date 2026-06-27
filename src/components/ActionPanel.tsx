'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { useToast } from '@/components/toast/toast-provider';
import { ConfirmDialog } from './ConfirmDialog';

/**
 * Defines the per-action screen-reader-only disabled reasons.
 * When a reason is provided for an action, the corresponding button is disabled,
 * and the reason text is rendered into a visually hidden `span` that is linked
 * to the button via `aria-describedby` (e.g., `id="action-panel-submitMilestone-reason"`).
 */
export type ActionPanelDisabledReasons = {
  /** Screen-reader description for why "Submit Milestone" is disabled. */
  submitMilestone?: string;
  /** Screen-reader description for why "Release Funds" is disabled. */
  releaseFunds?: string;
  /** Screen-reader description for why "Dispute" is disabled. */
  dispute?: string;
  /** Screen-reader description for why "View Summary" is disabled. */
  viewSummary?: string;
};

/**
 * Props for the ActionPanel component.
 */
export type ActionPanelProps = {
  /** 
   * Current lifecycle status of the contract
   * This drives which actions are visible and their order (mapped via `getActionButtons`).
   */
  status: 'Active' | 'Completed' | 'Disputed' | 'Pending';
  /** Callback triggered when the user initiates a milestone submission. */
  onSubmitMilestone?: () => void;
  /** Callback triggered when the user initiates a dispute. */
  onDispute?: () => void;
  /** Callback triggered when the user releases funds to the freelancer. */
  onReleaseFunds?: () => void;
  /** Callback triggered to view the summary of a completed contract. */
  onViewSummary?: () => void;
  /** 
   * Disables every visible action button globally and maps their `aria-describedby` 
   * to a shared loading reason (`action-panel-loading-reason`). Use this while 
   * fetching contract or wallet state. 
   */
  isLoading?: boolean;
  /** 
   * Render a `role="alert"` region above the actions to announce transient 
   * errors (like network failures) to assistive technologies. 
   */
  errorMessage?: string;
  /** 
   * Per-action accessible reason for why a specific button is disabled. 
   * This is useful for wallet-gating, unmet conditions, or missing permissions.
   */
  disabledReasons?: ActionPanelDisabledReasons;
};

const LOADING_REASON = 'Action is disabled while contract data is loading.';
const LOADING_DESCRIPTION_ID = 'action-panel-loading-reason';

const getActionButtons = (status: ActionPanelProps['status']) => {
  if (status === 'Active') return ['Submit Milestone', 'Release Funds', 'Dispute'];
  if (status === 'Pending') return ['Release Funds', 'Dispute'];
  if (status === 'Disputed') return ['Dispute'];
  return ['View Summary'];
};

type ConfirmAction = 'submit' | 'release' | 'dispute' | null;

const CONFIRM_COPY = {
  // Submit milestone is confirmation-gated to match other escrow-changing actions.
  submit: {
    title: 'Confirm Submit Milestone',
    description: 'Are you sure you want to submit this milestone for approval? This action cannot be undone.',
    confirmLabel: 'Submit Milestone',
  },
  release: {
    title: 'Confirm Release Funds',
    description: 'Are you sure you want to release funds? This action cannot be undone.',
    confirmLabel: 'Release Funds',
  },
  dispute: {
    title: 'Confirm Dispute',
    description: 'Are you sure you want to open a dispute? This action cannot be undone.',
    confirmLabel: 'Dispute',
  },
} as const;

const ActionPanel = ({
  status,
  onSubmitMilestone,
  onDispute,
  onReleaseFunds,
  onViewSummary,
  isLoading = false,
  errorMessage,
  disabledReasons,
}: ActionPanelProps) => {
  const actions = getActionButtons(status);
  const { address } = useWallet();
  const { showSuccess } = useToast();
  const isWalletConnected = !!address;
  const noWalletMsg = 'Connect wallet to perform this action';
  const panelRef = useRef<HTMLElement | null>(null);

  const describedBy = (perActionId: string | undefined) =>
    isLoading ? LOADING_DESCRIPTION_ID : perActionId;
  const describedById = (key: keyof ActionPanelDisabledReasons) =>
    disabledReasons?.[key] ? `action-panel-${key}-reason` : undefined;

  const focusRingClass =
    'focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-blue-500';

  // Confirmation dialog state tracks the currently gated escrow action.
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const previousConfirmActionRef = useRef<ConfirmAction>(null);

  /**
   * Holds a reference to the button that opened the confirmation dialog.
   *
   * Captured via `event.currentTarget` inside `handleOpenConfirm` — not via a
   * static `ref` prop on each button — so it always points to the exact element
   * the user activated, regardless of how many confirmation-gated buttons are
   * rendered. After the dialog closes (confirm or cancel) focus is restored to
   * this element, satisfying WCAG 2.1 SC 3.2.2 and the APG dialog pattern.
   */
  const triggerElementRef = useRef<HTMLButtonElement | null>(null);

  const handleOpenConfirm = (
    action: Exclude<ConfirmAction, null>,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    triggerElementRef.current = event.currentTarget;
    setConfirmAction(action);
  };

  const handleConfirm = () => {
    if (confirmAction === 'submit') {
      onSubmitMilestone?.();
      showSuccess({
        title: 'Milestone submitted',
      });
    } else if (confirmAction === 'release') {
      onReleaseFunds?.();
    } else if (confirmAction === 'dispute') {
      onDispute?.();
    }
    setConfirmAction(null);
    // Restore focus to the button that triggered the dialog.
    triggerElementRef.current?.focus();
  };

  const handleCancel = () => {
    setConfirmAction(null);
    // Restore focus to the button that triggered the dialog.
    triggerElementRef.current?.focus();
  };

  useEffect(() => {
    const wasDialogOpen = previousConfirmActionRef.current !== null;

    if (wasDialogOpen && confirmAction === null) {
      const triggerButton = triggerElementRef.current;

      if (triggerButton && document.contains(triggerButton) && !triggerButton.disabled) {
        triggerButton.focus();
      } else {
        panelRef.current?.focus();
      }
    }

    previousConfirmActionRef.current = confirmAction;
  }, [confirmAction]);

  return (
    <aside
      ref={panelRef}
      tabIndex={-1}
      aria-labelledby="action-panel-heading"
      className="sticky top-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="mb-6">
        <p className="text-sm text-slate-500 uppercase tracking-[0.24em]">Action Panel</p>
        <h2 id="action-panel-heading" className="mt-2 text-xl font-semibold text-slate-900">
          What would you like to do?
        </h2>
        {!isWalletConnected && (
          <p className="mt-2 text-sm text-red-500 bg-red-50 p-2 rounded-lg border border-red-100">
            {noWalletMsg}
          </p>
        )}
        {errorMessage && (
          <p role="alert" className="mt-2 text-sm text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200">
            {errorMessage}
          </p>
        )}
        {isLoading && (
          <span id={LOADING_DESCRIPTION_ID} className="sr-only">
            {LOADING_REASON}
          </span>
        )}
        {disabledReasons?.submitMilestone && (
          <span id="action-panel-submitMilestone-reason" className="sr-only">
            {disabledReasons.submitMilestone}
          </span>
        )}
        {disabledReasons?.releaseFunds && (
          <span id="action-panel-releaseFunds-reason" className="sr-only">
            {disabledReasons.releaseFunds}
          </span>
        )}
        {disabledReasons?.dispute && (
          <span id="action-panel-dispute-reason" className="sr-only">
            {disabledReasons.dispute}
          </span>
        )}
        {disabledReasons?.viewSummary && (
          <span id="action-panel-viewSummary-reason" className="sr-only">
            {disabledReasons.viewSummary}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {actions.includes('Submit Milestone') && (
          <button
            type="button"
            onClick={(e) => handleOpenConfirm('submit', e)}
            disabled={!isWalletConnected || isLoading || !!disabledReasons?.submitMilestone}
            title={!isWalletConnected ? noWalletMsg : undefined}
            aria-label="Submit milestone for approval"
            aria-describedby={describedBy(describedById('submitMilestone'))}
            className={`w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed ${focusRingClass}`}
          >
            Submit Milestone
          </button>
        )}

        {actions.includes('Release Funds') && (
          <button
            type="button"
            onClick={(event) => handleOpenConfirm('release', event)}
            disabled={!isWalletConnected || isLoading || !!disabledReasons?.releaseFunds}
            title={!isWalletConnected ? noWalletMsg : undefined}
            aria-label="Release funds to the contractor"
            aria-describedby={describedBy(describedById('releaseFunds'))}
            className={`w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400 disabled:opacity-50 disabled:cursor-not-allowed ${focusRingClass}`}
          >
            Release Funds
          </button>
        )}

        {actions.includes('Dispute') && (
          <button
            type="button"
            onClick={(event) => handleOpenConfirm('dispute', event)}
            disabled={!isWalletConnected || isLoading || !!disabledReasons?.dispute}
            title={!isWalletConnected ? noWalletMsg : undefined}
            aria-label="Open a dispute for this contract"
            aria-describedby={describedBy(describedById('dispute'))}
            className={`w-full rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed ${focusRingClass}`}
          >
            Dispute
          </button>
        )}

        {actions.includes('View Summary') && (
          <button
            type="button"
            onClick={() => onViewSummary?.()}
            disabled={isLoading || !!disabledReasons?.viewSummary}
            aria-label="View contract summary details"
            aria-describedby={describedBy(describedById('viewSummary'))}
            className={`w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400 disabled:opacity-50 disabled:cursor-not-allowed ${focusRingClass}`}
          >
            View Summary
          </button>
        )}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmAction !== null}
        title={confirmAction ? CONFIRM_COPY[confirmAction].title : ''}
        description={confirmAction ? CONFIRM_COPY[confirmAction].description : ''}
        confirmLabel={confirmAction ? CONFIRM_COPY[confirmAction].confirmLabel : 'Confirm'}
        cancelLabel="Cancel"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </aside>
  );
};

export default ActionPanel;

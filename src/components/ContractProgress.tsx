'use client';

import { usePreferences } from '@/lib/preferences';
import { Milestone } from './MilestonesList';

export interface ContractProgressProps {
  milestones: Milestone[];
}

/**
 * Derives escrow progress metrics from a milestone array.
 *
 * Calculates:
 * - `completedCount`: Number of milestones with status "Completed" or "Paid".
 * - `totalCount`: Total number of milestones.
 * - `paidAmount`: Sum of payouts for milestones with status "Completed" or "Paid".
 * - `outstandingAmount`: Sum of payouts for all other milestones.
 *
 * Guards against empty arrays and ensures safe integer arithmetic (no overflow risk
 * within JavaScript's Number.MAX_SAFE_INTEGER bounds for typical contract values).
 *
 * @param milestones - Array of milestone objects.
 * @returns An object containing completedCount, totalCount, paidAmount, and outstandingAmount.
 */
function calculateProgress(milestones: Milestone[]) {
  if (!milestones || milestones.length === 0) {
    return {
      completedCount: 0,
      totalCount: 0,
      paidAmount: 0,
      outstandingAmount: 0,
    };
  }

  let completedCount = 0;
  let paidAmount = 0;
  let outstandingAmount = 0;

  for (const milestone of milestones) {
    const isCompleted = milestone.status === 'Completed' || milestone.status === 'Paid';
    
    if (isCompleted) {
      completedCount += 1;
      paidAmount += milestone.payout;
    } else {
      outstandingAmount += milestone.payout;
    }
  }

  return {
    completedCount,
    totalCount: milestones.length,
    paidAmount,
    outstandingAmount,
  };
}

/**
 * ContractProgress displays an accessible escrow summary and milestone progress panel.
 *
 * Features:
 * - Calculates completed milestone count and total milestone count.
 * - Calculates total paid funds vs. outstanding funds in escrow.
 * - Displays a visual and semantic progress bar with ARIA attributes.
 * - Formats monetary values using user preferences.
 * - Handles edge cases: zero milestones, all paid, none paid.
 *
 * Empty-state behaviour (totalCount === 0):
 * - Renders an explicit "No milestones yet" message in place of the progress
 *   bar and "0 / 0" completion row.
 * - The `role="progressbar"` element is intentionally omitted for the empty
 *   state — an indeterminate bar with aria-valuenow="0" out of 0 milestones
 *   conveys no meaningful information to assistive technologies and reads as
 *   a broken state rather than "not started". The financial cards (Paid /
 *   Outstanding) are still rendered showing zero values so the card layout
 *   remains consistent with the non-empty state.
 *
 * Accessibility:
 * - Semantic `<section>` with `aria-labelledby` referencing the heading.
 * - Progress bar uses `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, and `aria-valuemax`.
 * - Screen reader text provides context for the progress percentage.
 * - Empty state uses a plain `<p>` so screen readers announce it naturally.
 *
 * @param props - Component props.
 * @param props.milestones - Array of milestone objects.
 *
 * @example
 * ```tsx
 * <ContractProgress milestones={sampleMilestones} />
 * ```
 */
const ContractProgress = ({ milestones }: ContractProgressProps) => {
  const { formatAmount } = usePreferences();
  const { completedCount, totalCount, paidAmount, outstandingAmount } = calculateProgress(milestones);

  // Calculate progress percentage (0–100)
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Determine currency from first milestone, fallback to USD
  const currency = milestones.length > 0 ? milestones[0].currency : 'USD';

  /**
   * Empty-state branch: no milestones have been added to this contract yet.
   *
   * Renders a descriptive message instead of a "0 of 0" progress bar, which
   * would read as broken to both sighted users and screen reader users.
   * The financial summary cards are retained at zero so the card layout stays
   * consistent and the section still communicates "nothing paid, nothing
   * outstanding" rather than showing no financial context at all.
   */
  const isEmpty = totalCount === 0;

  return (
    <section
      aria-labelledby="contract-progress-title"
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2 id="contract-progress-title" className="text-xl font-semibold text-slate-900">
        Escrow Progress
      </h2>

      <div className="mt-6 space-y-6">
        {isEmpty ? (
          /* Empty state — no milestones attached to this contract yet */
          <p className="text-sm text-slate-500">
            No milestones yet
          </p>
        ) : (
          /* Milestone completion progress */
          <div>
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>Milestones completed</span>
              <span className="font-semibold text-slate-900">
                {completedCount} / {totalCount}
              </span>
            </div>
            <div className="mt-3">
              <div
                role="progressbar"
                aria-valuenow={progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${completedCount} of ${totalCount} milestones completed, ${progressPercent}%`}
                className="relative h-3 w-full overflow-hidden rounded-full bg-slate-200"
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                >
                  <span className="sr-only">{progressPercent}% complete</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Financial summary — rendered for both empty and non-empty states */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-emerald-50 p-4">
            <p className="text-sm text-emerald-700 font-medium">Paid</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-900">
              {formatAmount(paidAmount, currency)}
            </p>
          </div>
          <div className="rounded-2xl bg-amber-50 p-4">
            <p className="text-sm text-amber-700 font-medium">Outstanding</p>
            <p className="mt-2 text-2xl font-semibold text-amber-900">
              {formatAmount(outstandingAmount, currency)}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContractProgress;

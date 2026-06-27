'use client';

import { usePreferences } from '@/lib/preferences';
import { useContractProgress } from '@/hooks/useContractProgress';
import { Milestone } from './MilestonesList';

export interface ContractProgressProps {
  milestones: Milestone[];
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
 * Accessibility:
 * - Semantic `<section>` with `aria-labelledby` referencing the heading.
 * - Progress bar uses `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, and `aria-valuemax`.
 * - Screen reader text provides context for the progress percentage.
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
  const { completedCount, totalCount, paidAmount, outstandingAmount, progressPercent, currency } =
    useContractProgress(milestones);

  return (
    <section
      aria-labelledby="contract-progress-title"
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2 id="contract-progress-title" className="text-xl font-semibold text-slate-900">
        Escrow Progress
      </h2>

      <div className="mt-6 space-y-6">
        {/* Milestone completion progress */}
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

        {/* Financial summary */}
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

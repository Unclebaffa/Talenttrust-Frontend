import StatusBadge, { StatusType } from './StatusBadge';
import { usePreferences } from '@/lib/preferences';

export type Milestone = {
  id: string;
  title: string;
  status: StatusType;
  payout: number;
  currency: string;
  dueDate?: string;
};

export type MilestonesListProps = {
  milestones: Milestone[];
};

const MilestonesList = ({ milestones }: MilestonesListProps) => {
  const { formatAmount } = usePreferences();
  return (
    <section aria-labelledby="milestones-title" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <h2 id="milestones-title" className="text-xl font-semibold text-slate-900">
          Milestones
        </h2>
        <span className="text-sm text-slate-500">{milestones.length} total</span>
      </div>

      {/* 
        Keyboard Accessibility (WCAG 2.1.1):
        We make the scrollable milestones container focusable (tabIndex={0}) and assign it a 'region' role
        with an accessible label (aria-label="Milestones list"). This allows keyboard-only users to
        navigate to the region and scroll its contents using the arrow keys.
        
        Why this is always applied when the list is populated:
        Always applying tabIndex={0} when milestones are present ensures:
        1. Consistency between Server-Side Rendering (SSR) and client hydration, avoiding layout/hydration shifts.
        2. Testability in JSDOM environments where DOM layout metrics (clientHeight/scrollHeight) are always zero.
      */}
      <div
        role={milestones.length > 0 ? 'region' : undefined}
        aria-label={milestones.length > 0 ? 'Milestones list' : undefined}
        tabIndex={milestones.length > 0 ? 0 : undefined}
        className="mt-6 space-y-4 max-h-[calc(100vh-260px)] overflow-y-auto pr-2 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
      >
        {milestones.map((milestone) => (
          <article
            key={milestone.id}
            className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">{milestone.title}</p>
                <p className="mt-1 text-sm text-slate-500">Due {milestone.dueDate ?? 'TBD'}</p>
              </div>
              <StatusBadge status={milestone.status} />
            </div>
            <div className="mt-4 flex items-center justify-between gap-4 border-t border-slate-200 pt-4 text-sm text-slate-600">
              <p>Payout</p>
              <p className="font-semibold text-slate-900">
                {formatAmount(milestone.payout, milestone.currency)}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default MilestonesList;

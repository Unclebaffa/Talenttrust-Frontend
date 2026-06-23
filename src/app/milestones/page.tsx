'use client';

import React, { useState, useMemo } from 'react';
import EmptyState from '../../components/EmptyState';
import MilestonesList, { Milestone } from '../../components/MilestonesList';
import MilestoneFilter, { MilestoneStatusFilter } from '../../components/milestones/MilestoneFilter';

/**
 * Sample milestone data covering all four statuses exercised by the filter.
 * In a real application this would be fetched from an API.
 */
const SAMPLE_MILESTONES: Milestone[] = [
  {
    id: '1',
    title: 'Project Kickoff & Discovery',
    status: 'Completed',
    payout: 1500,
    currency: 'USD',
    dueDate: 'Jan 15, 2026',
  },
  {
    id: '2',
    title: 'UI/UX Design Handoff',
    status: 'Paid',
    payout: 2000,
    currency: 'USD',
    dueDate: 'Feb 28, 2026',
  },
  {
    id: '3',
    title: 'Frontend Development – Sprint 1',
    status: 'Pending',
    payout: 3500,
    currency: 'USD',
    dueDate: 'Apr 10, 2026',
  },
  {
    id: '4',
    title: 'API Integration & Testing',
    status: 'Pending',
    payout: 2500,
    currency: 'USD',
    dueDate: 'May 20, 2026',
  },
  {
    id: '5',
    title: 'Payment Gateway Integration',
    status: 'Disputed',
    payout: 1800,
    currency: 'USD',
    dueDate: 'Jun 01, 2026',
  },
];

const MilestonesPage: React.FC = () => {
  const milestones: Milestone[] = SAMPLE_MILESTONES;

  const [statusFilter, setStatusFilter] = useState<MilestoneStatusFilter>('All');

  const filtered = useMemo(() => {
    if (statusFilter === 'All') return milestones;
    return milestones.filter((m) => m.status === statusFilter);
  }, [milestones, statusFilter]);

  const handleAddMilestone = () => {
    // TODO: Implement add milestone logic
    console.log('Add milestone');
  };

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-6">Milestones</h1>

      {milestones.length === 0 ? (
        <EmptyState
          illustration="milestones"
          title="No milestones tracked"
          description="Track your progress by adding milestones to your contracts. Milestones help you stay organized and ensure timely delivery."
          actionLabel="Add Milestone"
          onAction={handleAddMilestone}
        />
      ) : (
        <>
          <MilestoneFilter
            selected={statusFilter}
            onChange={setStatusFilter}
            resultCount={filtered.length}
          />

          {filtered.length === 0 ? (
            <EmptyState
              illustration="milestones"
              title="No milestones match this filter"
              description={`There are no ${statusFilter.toLowerCase()} milestones at the moment. Try a different filter or add a new milestone.`}
              actionLabel="Add Milestone"
              onAction={handleAddMilestone}
            />
          ) : (
            <MilestonesList milestones={filtered} />
          )}
        </>
      )}
    </main>
  );
};

export default MilestonesPage;

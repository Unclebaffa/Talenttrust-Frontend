import React from 'react';
import { render, screen } from '@testing-library/react';
import MilestonesList from '../MilestonesList';

describe('MilestonesList', () => {
  it('renders each milestone item with status and payout', () => {
    render(
      <MilestonesList
        milestones={[
          { id: '1', title: 'Milestone 1', status: 'Pending', payout: 500, currency: 'USD', dueDate: 'May 10, 2026' },
          { id: '2', title: 'Milestone 2', status: 'Completed', payout: 1000, currency: 'USD', dueDate: 'Jun 1, 2026' },
        ]}
      />
    );

    expect(screen.getByText('Milestone 1')).toBeInTheDocument();
    expect(screen.getByText('Milestone 2')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('$500.00')).toBeInTheDocument();
    expect(screen.getByText('$1,000.00')).toBeInTheDocument();
  });

  it('makes the container a keyboard-accessible scroll region when milestones are present', () => {
    const { container } = render(
      <MilestonesList
        milestones={[
          { id: '1', title: 'Milestone 1', status: 'Pending', payout: 500, currency: 'USD', dueDate: 'May 10, 2026' },
        ]}
      />
    );

    const scrollContainer = container.querySelector('.max-h-\\[calc\\(100vh-260px\\)\\]');
    expect(scrollContainer).toBeInTheDocument();
    expect(scrollContainer).toHaveAttribute('role', 'region');
    expect(scrollContainer).toHaveAttribute('tabIndex', '0');
    expect(scrollContainer).toHaveAttribute('aria-label', 'Milestones list');
    expect(scrollContainer).toHaveClass(
      'focus-visible:outline-none',
      'focus-visible:ring-2',
      'focus-visible:ring-[var(--ring)]',
      'focus-visible:ring-offset-2'
    );
  });

  it('does not apply scroll region attributes when milestones list is empty', () => {
    const { container } = render(<MilestonesList milestones={[]} />);
    
    // The inner container div should not have tabIndex, role, or aria-labelledby
    const scrollContainer = container.querySelector('.max-h-\\[calc\\(100vh-260px\\)\\]');
    expect(scrollContainer).toBeInTheDocument();
    expect(scrollContainer).not.toHaveAttribute('tabIndex');
    expect(scrollContainer).not.toHaveAttribute('role');
    expect(scrollContainer).not.toHaveAttribute('aria-labelledby');
  });
});

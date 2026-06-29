import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import MilestonesList from '../MilestonesList';
import type { Milestone } from '../MilestonesList';
import type { StatusType } from '../StatusBadge';

const SAMPLE: Milestone[] = [
  { id: '1', title: 'Milestone 1', status: 'Pending', payout: 500, currency: 'USD', dueDate: 'May 10, 2026' },
  { id: '2', title: 'Milestone 2', status: 'Completed', payout: 1000, currency: 'USD', dueDate: 'Jun 1, 2026' },
];

const MISMATCHED: Milestone[] = [
  { id: '1', title: 'Milestone 1', status: 'Pending', payout: 500, currency: 'USD', dueDate: 'May 10, 2026' },
  { id: '2', title: 'Milestone 2', status: 'Completed', payout: 1000, currency: 'EUR', dueDate: 'Jun 1, 2026' },
];

const scrollRegion = (container: HTMLElement) =>
  container.querySelector('.max-h-\\[calc\\(100vh-260px\\)\\]') as HTMLElement;

describe('MilestonesList', () => {
  it('renders each milestone item with status and payout', () => {
    render(<MilestonesList milestones={SAMPLE} />);

    expect(screen.getByText('Milestone 1')).toBeInTheDocument();
    expect(screen.getByText('Milestone 2')).toBeInTheDocument();
    expect(screen.getAllByText('Pending')).toHaveLength(2);
    expect(screen.getAllByText('Completed')).toHaveLength(2);
    expect(screen.getByText('$500.00')).toBeInTheDocument();
    expect(screen.getByText('$1,000.00')).toBeInTheDocument();
  });

  describe('scroll region labelling', () => {
    it('associates the region with the visible heading via aria-labelledby', () => {
      const { container } = render(<MilestonesList milestones={SAMPLE} />);

      const heading = screen.getByRole('heading', { name: 'Milestones' });
      expect(heading).toHaveAttribute('id', 'milestones-title');

      const region = scrollRegion(container);
      expect(region).toHaveAttribute('role', 'region');
      expect(region.getAttribute('aria-labelledby')).toContain('milestones-title');
    });

    it('includes the count span id in aria-labelledby', () => {
      const { container } = render(<MilestonesList milestones={SAMPLE} />);

      const countSpan = container.querySelector('#milestones-count');
      expect(countSpan).toBeInTheDocument();
      expect(countSpan).toHaveTextContent('2 total');

      const region = scrollRegion(container);
      expect(region.getAttribute('aria-labelledby')).toContain('milestones-count');
    });

    it('count span reflects a single-item list', () => {
      const { container } = render(
        <MilestonesList milestones={[SAMPLE[0]]} />
      );
      expect(container.querySelector('#milestones-count')).toHaveTextContent('1 total');
    });

    it('does not apply region attributes when the list is empty', () => {
      const { container } = render(<MilestonesList milestones={[]} />);
      const region = scrollRegion(container);
      expect(region).not.toHaveAttribute('role');
      expect(region).not.toHaveAttribute('tabIndex');
      expect(region).not.toHaveAttribute('aria-labelledby');
    });

    it('does not use a static aria-label on the scroll region', () => {
      const { container } = render(<MilestonesList milestones={SAMPLE} />);
      expect(scrollRegion(container)).not.toHaveAttribute('aria-label');
    });
  });

  it('makes the scroll region keyboard-focusable with focus-ring styles when populated', () => {
    const { container } = render(<MilestonesList milestones={SAMPLE} />);
    const region = scrollRegion(container);
    expect(region).toHaveAttribute('tabIndex', '0');
    expect(region).toHaveClass(
      'focus-visible:outline-none',
      'focus-visible:ring-2',
      'focus-visible:ring-[var(--ring)]',
      'focus-visible:ring-offset-2'
    );
  });

  it('does not render a currency warning when the contract currency is absent', () => {
    render(<MilestonesList milestones={MIXED_CURRENCY_SAMPLE} />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders an accessible warning for milestone currencies that differ from the contract', () => {
    render(
      <MilestonesList
        milestones={MIXED_CURRENCY_SAMPLE}
        contractCurrency="usd"
      />
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('2 milestones use EUR, GBP instead of USD.');
    expect(alert).toHaveTextContent('Milestone 2: €1,000.00');
    expect(alert).toHaveTextContent('Milestone 3: £250.00');
  });

  it('passes axe accessibility checks with a populated list', async () => {
    const { container } = render(<MilestonesList milestones={SAMPLE} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('passes axe accessibility checks with a currency mismatch warning', async () => {
    const { container } = render(
      <MilestonesList
        milestones={MIXED_CURRENCY_SAMPLE}
        contractCurrency="USD"
      />
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it('passes axe accessibility checks with an empty list', async () => {
    const { container } = render(<MilestonesList milestones={[]} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  describe('currency mismatch warning', () => {
    it('does not render warning when all milestones match contract currency', () => {
      const { container } = render(
        <MilestonesList milestones={SAMPLE} contractCurrency="USD" />,
      );
      expect(container.querySelector('[role="alert"]')).not.toBeInTheDocument();
    });

    it('does not render warning when contractCurrency is not provided', () => {
      const { container } = render(
        <MilestonesList milestones={MISMATCHED} />,
      );
      expect(container.querySelector('[role="alert"]')).not.toBeInTheDocument();
    });

    it('renders warning with role="alert" when a milestone currency mismatches', () => {
      const { container } = render(
        <MilestonesList milestones={MISMATCHED} contractCurrency="USD" />,
      );
      const alert = container.querySelector('[role="alert"]');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent('Currency mismatch');
    });

    it('shows singular text for a single mismatched milestone', () => {
      render(
        <MilestonesList milestones={MISMATCHED} contractCurrency="USD" />,
      );
      expect(screen.getByText(/1 milestone uses EUR instead of USD/i)).toBeInTheDocument();
    });

    it('shows plural text for multiple mismatched milestones', () => {
      const multiMismatch: Milestone[] = [
        { id: '1', title: 'M1', status: 'Pending', payout: 500, currency: 'EUR' },
        { id: '2', title: 'M2', status: 'Pending', payout: 600, currency: 'EUR' },
      ];
      render(
        <MilestonesList milestones={multiMismatch} contractCurrency="USD" />,
      );
      expect(screen.getByText(/2 milestones use EUR instead of USD/i)).toBeInTheDocument();
    });

    it('lists multiple distinct mismatched currencies', () => {
      const multiCurrencyMismatch: Milestone[] = [
        { id: '1', title: 'M1', status: 'Pending', payout: 500, currency: 'EUR' },
        { id: '2', title: 'M2', status: 'Pending', payout: 600, currency: 'GBP' },
      ];
      render(
        <MilestonesList milestones={multiCurrencyMismatch} contractCurrency="USD" />,
      );
      expect(screen.getByText(/2 milestones use EUR, GBP instead of USD/i)).toBeInTheDocument();
    });

    it('case-insensitive match does not trigger warning', () => {
      const caseInsensitiveMismatch: Milestone[] = [
        { id: '1', title: 'M1', status: 'Pending', payout: 500, currency: 'usd' },
        { id: '2', title: 'M2', status: 'Pending', payout: 600, currency: 'Usd' },
      ];
      const { container } = render(
        <MilestonesList milestones={caseInsensitiveMismatch} contractCurrency="USD" />,
      );
      expect(container.querySelector('[role="alert"]')).not.toBeInTheDocument();
    });

    it('passes axe accessibility check with mismatch warning visible', async () => {
      const { container } = render(
        <MilestonesList milestones={MISMATCHED} contractCurrency="USD" />,
      );
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});

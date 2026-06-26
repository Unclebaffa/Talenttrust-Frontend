import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ContractProgress from '../ContractProgress';
import { Milestone } from '../MilestonesList';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

// Stub out usePreferences with a stable formatAmount so tests don't rely on
// Intl internals and are independent of a PreferencesProvider in the tree.
jest.mock('@/lib/preferences', () => ({
  usePreferences: jest.fn(() => ({
    formatAmount: (amount: number, currency: string = 'USD') =>
      `${currency} ${amount.toFixed(2)}`,
  })),
}));

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

function makeCompletedMilestone(overrides?: Partial<Milestone>): Milestone {
  return {
    id: 'ms-completed',
    title: 'Completed milestone',
    status: 'Completed',
    payout: 1000,
    currency: 'USD',
    ...overrides,
  };
}

function makePaidMilestone(overrides?: Partial<Milestone>): Milestone {
  return {
    id: 'ms-paid',
    title: 'Paid milestone',
    status: 'Paid',
    payout: 500,
    currency: 'USD',
    ...overrides,
  };
}

function makePendingMilestone(overrides?: Partial<Milestone>): Milestone {
  return {
    id: 'ms-pending',
    title: 'Pending milestone',
    status: 'Pending',
    payout: 2500,
    currency: 'USD',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ContractProgress', () => {
  // -------------------------------------------------------------------------
  // Rendering structure
  // -------------------------------------------------------------------------

  describe('rendering', () => {
    it('renders the section heading', () => {
      render(<ContractProgress milestones={[]} />);
      expect(screen.getByRole('heading', { name: /escrow progress/i })).toBeInTheDocument();
    });

    it('renders the progressbar element', () => {
      render(<ContractProgress milestones={[]} />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('renders "Paid" and "Outstanding" fund cards', () => {
      render(<ContractProgress milestones={[]} />);
      expect(screen.getByText(/^Paid$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Outstanding$/i)).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Zero milestones
  // -------------------------------------------------------------------------

  describe('zero milestones', () => {
    it('shows 0 / 0 completion ratio', () => {
      render(<ContractProgress milestones={[]} />);
      expect(screen.getByText('0 / 0')).toBeInTheDocument();
    });

    it('sets aria-valuenow to 0 on the progressbar', () => {
      render(<ContractProgress milestones={[]} />);
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    });

    it('displays $0.00 for both paid and outstanding when milestones is empty', () => {
      render(<ContractProgress milestones={[]} />);
      // Both paid and outstanding should render 0
      const zeroes = screen.getAllByText('USD 0.00');
      expect(zeroes).toHaveLength(2);
    });
  });

  // -------------------------------------------------------------------------
  // All-paid milestones
  // -------------------------------------------------------------------------

  describe('all-paid milestones', () => {
    const allPaid: Milestone[] = [
      makeCompletedMilestone({ id: 'ms-1', payout: 1000 }),
      makePaidMilestone({ id: 'ms-2', payout: 2000 }),
    ];

    it('shows the correct completion ratio', () => {
      render(<ContractProgress milestones={allPaid} />);
      expect(screen.getByText('2 / 2')).toBeInTheDocument();
    });

    it('sets aria-valuenow to 100 when all milestones are complete', () => {
      render(<ContractProgress milestones={allPaid} />);
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    });

    it('displays the full summed payout as paid', () => {
      render(<ContractProgress milestones={allPaid} />);
      // $1000 + $2000 = $3000
      expect(screen.getByText('USD 3000.00')).toBeInTheDocument();
    });

    it('displays USD 0.00 for outstanding when all milestones are complete', () => {
      render(<ContractProgress milestones={allPaid} />);
      expect(screen.getByText('USD 0.00')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // None-paid milestones
  // -------------------------------------------------------------------------

  describe('none-paid milestones', () => {
    const nonePaid: Milestone[] = [
      makePendingMilestone({ id: 'ms-1', payout: 1500 }),
      makePendingMilestone({ id: 'ms-2', payout: 2500, status: 'Active' }),
    ];

    it('shows 0 / 2 completion ratio', () => {
      render(<ContractProgress milestones={nonePaid} />);
      expect(screen.getByText('0 / 2')).toBeInTheDocument();
    });

    it('sets aria-valuenow to 0 when no milestones are complete', () => {
      render(<ContractProgress milestones={nonePaid} />);
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    });

    it('displays USD 0.00 for paid when no milestones are complete', () => {
      render(<ContractProgress milestones={nonePaid} />);
      expect(screen.getByText('USD 0.00')).toBeInTheDocument();
    });

    it('displays the full summed payout as outstanding', () => {
      render(<ContractProgress milestones={nonePaid} />);
      // $1500 + $2500 = $4000
      expect(screen.getByText('USD 4000.00')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Mixed milestones
  // -------------------------------------------------------------------------

  describe('mixed milestones', () => {
    const mixed: Milestone[] = [
      makeCompletedMilestone({ id: 'ms-1', payout: 1500 }),
      makePendingMilestone({ id: 'ms-2', payout: 2500 }),
      makePendingMilestone({ id: 'ms-3', payout: 3000 }),
    ];

    it('shows 1 / 3 completion ratio', () => {
      render(<ContractProgress milestones={mixed} />);
      expect(screen.getByText('1 / 3')).toBeInTheDocument();
    });

    it('sets aria-valuenow to 33 for 1 of 3 milestones (rounded)', () => {
      render(<ContractProgress milestones={mixed} />);
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '33');
    });

    it('displays the paid amount correctly', () => {
      render(<ContractProgress milestones={mixed} />);
      expect(screen.getByText('USD 1500.00')).toBeInTheDocument();
    });

    it('displays the outstanding amount correctly', () => {
      render(<ContractProgress milestones={mixed} />);
      // $2500 + $3000 = $5500
      expect(screen.getByText('USD 5500.00')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // ARIA attributes on the progressbar
  // -------------------------------------------------------------------------

  describe('progressbar ARIA attributes', () => {
    it('always sets aria-valuemin to 0', () => {
      render(<ContractProgress milestones={[makeCompletedMilestone()]} />);
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemin', '0');
    });

    it('always sets aria-valuemax to 100', () => {
      render(<ContractProgress milestones={[makeCompletedMilestone()]} />);
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '100');
    });

    it('sets a descriptive aria-label including counts and percentage', () => {
      const milestones = [makeCompletedMilestone(), makePendingMilestone()];
      render(<ContractProgress milestones={milestones} />);
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute(
        'aria-label',
        '1 of 2 milestones completed, 50%',
      );
    });

    it('aria-valuenow is 50 for half-completed milestones', () => {
      const milestones = [makeCompletedMilestone(), makePendingMilestone()];
      render(<ContractProgress milestones={milestones} />);
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
    });

    it('aria-valuenow is 0 for zero milestones', () => {
      render(<ContractProgress milestones={[]} />);
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    });
  });

  // -------------------------------------------------------------------------
  // "Paid" status treatment (same as "Completed" for fund calculations)
  // -------------------------------------------------------------------------

  describe('"Paid" status milestone handling', () => {
    it('counts "Paid" milestones as completed', () => {
      render(<ContractProgress milestones={[makePaidMilestone()]} />);
      expect(screen.getByText('1 / 1')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    });

    it('includes "Paid" milestone payout in the paid amount', () => {
      render(<ContractProgress milestones={[makePaidMilestone({ payout: 750 })]} />);
      expect(screen.getByText('USD 750.00')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Currency fallback
  // -------------------------------------------------------------------------

  describe('currency fallback', () => {
    it('falls back to USD when milestones array is empty', () => {
      render(<ContractProgress milestones={[]} />);
      // Both cards rendered with USD 0.00 (from stub formatAmount)
      const usdLabels = screen.getAllByText('USD 0.00');
      expect(usdLabels.length).toBeGreaterThanOrEqual(1);
    });

    it('uses the currency from the first milestone', () => {
      const milestones = [makeCompletedMilestone({ currency: 'NGN', payout: 200000 })];
      render(<ContractProgress milestones={milestones} />);
      expect(screen.getByText('NGN 200000.00')).toBeInTheDocument();
    });
  });
});

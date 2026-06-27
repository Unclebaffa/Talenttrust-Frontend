/**
 * Tests for ContractsPage — create-and-list state refresh (#241)
 *
 * Covered scenarios:
 * 1. Empty state: renders EmptyState with accessible "Create Contract" action
 * 2. Create action: clicking the action opens the ContractCreationForm dialog
 * 3. Cancel: closing the form returns to the empty state view
 * 4. Submit: persists the contract via saveContract, re-reads via listContracts,
 *    closes the form, and renders the new contract in the list
 * 5. Pre-seeded list: pre-existing contracts render without showing the empty state
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ContractsPage from '../page';
import * as repository from '@/lib/repository';
import * as stellarAddress from '@/lib/stellarAddress';
import type { Contract } from '@/types/domain';

jest.mock('@/lib/repository');
jest.mock('@/lib/stellarAddress');

const mockList = repository.listContracts as jest.MockedFunction<typeof repository.listContracts>;
const mockSave = repository.saveContract as jest.MockedFunction<typeof repository.saveContract>;
const mockIsValid = stellarAddress.isValidStellarAddress as jest.MockedFunction<
  typeof stellarAddress.isValidStellarAddress
>;

/** A valid 56-char Stellar public key used across form submissions. */
const ADDR = 'GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H';

/** Minimal contract fixture for seeding the list. */
const CONTRACT_FIXTURE: Contract = {
  contractName: 'Design Sprint',
  parties: [
    { label: 'Client', address: ADDR },
    { label: 'Freelancer', address: ADDR },
  ],
  totalValue: 5000,
  currency: 'USD',
  status: 'Active',
  createdAt: 'Jan 15, 2025',
  milestoneCount: 3,
};

/**
 * Fill and submit the contract creation form with valid data.
 * Assumes the dialog is already open.
 */
function fillAndSubmitForm(contractName = 'New Contract') {
  fireEvent.change(screen.getByLabelText(/contract name/i), {
    target: { value: contractName },
  });
  fireEvent.change(screen.getByLabelText(/total value/i), {
    target: { value: '1000' },
  });

  const labels = screen.getAllByPlaceholderText(/e\.g\., client, freelancer/i);
  const addresses = screen.getAllByPlaceholderText(/GXXXXXXXXXX/i);

  fireEvent.change(labels[0], { target: { value: 'Client' } });
  fireEvent.change(addresses[0], { target: { value: ADDR } });
  fireEvent.change(labels[1], { target: { value: 'Freelancer' } });
  fireEvent.change(addresses[1], { target: { value: ADDR } });

  // The submit button inside the dialog also reads "Create Contract"
  const buttons = screen.getAllByRole('button', { name: /create contract/i });
  fireEvent.click(buttons[buttons.length - 1]);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockList.mockReturnValue([]);
  mockIsValid.mockImplementation((addr) => addr === ADDR);
});

// ---------------------------------------------------------------------------
// 1. Empty state
// ---------------------------------------------------------------------------

/** Renders the EmptyState region with the correct heading and description. */
it('renders EmptyState heading and description when storage is empty', () => {
  render(<ContractsPage />);

  expect(screen.getByText('No contracts found')).toBeInTheDocument();
  expect(
    screen.getByText(/you haven't created any contracts yet/i),
  ).toBeInTheDocument();
});

/** The EmptyState action button must be accessible by its label. */
it('renders accessible "Create Contract" button in the empty state', () => {
  render(<ContractsPage />);

  expect(screen.getByRole('button', { name: 'Create Contract' })).toBeInTheDocument();
});

/** No dialog should be present before the user triggers the create action. */
it('does not show the creation form on initial render', () => {
  render(<ContractsPage />);

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

// ---------------------------------------------------------------------------
// 2. Create action opens the form
// ---------------------------------------------------------------------------

/** Clicking the empty-state action must open the ContractCreationForm dialog. */
it('opens ContractCreationForm dialog when create action is clicked', () => {
  render(<ContractsPage />);

  fireEvent.click(screen.getByRole('button', { name: 'Create Contract' }));

  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getByText(/create new contract/i)).toBeInTheDocument();
});

// ---------------------------------------------------------------------------
// 3. Cancel returns to empty state
// ---------------------------------------------------------------------------

/** Cancelling the form must close the dialog and restore the empty state view. */
it('closes the dialog and shows empty state when cancel is clicked', async () => {
  render(<ContractsPage />);

  fireEvent.click(screen.getByRole('button', { name: 'Create Contract' }));
  expect(screen.getByRole('dialog')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(screen.getByText('No contracts found')).toBeInTheDocument();
});

// ---------------------------------------------------------------------------
// 4. Submit → persist, refresh list, close form
// ---------------------------------------------------------------------------

/**
 * After a valid submission the page must:
 * - call saveContract once with the correct payload
 * - call listContracts again to refresh state
 * - close the dialog
 * - render the new contract in the list
 */
it('persists contract, refreshes list, and closes form on submit', async () => {
  render(<ContractsPage />);

  fireEvent.click(screen.getByRole('button', { name: 'Create Contract' }));

  // Arrange: listContracts returns the new item on the post-save call
  mockList.mockReturnValue([CONTRACT_FIXTURE]);

  fillAndSubmitForm('Design Sprint');

  await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));

  expect(mockSave).toHaveBeenCalledWith(
    expect.objectContaining({
      contractName: 'Design Sprint',
      totalValue: 1000,
      status: 'Pending',
      milestoneCount: 0,
      parties: [
        { label: 'Client', address: ADDR },
        { label: 'Freelancer', address: ADDR },
      ],
    }),
  );

  // listContracts called at least twice: initial mount + post-save refresh
  expect(mockList.mock.calls.length).toBeGreaterThanOrEqual(2);

  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(screen.getByText('Design Sprint')).toBeInTheDocument();
  expect(screen.queryByText(/no contracts found/i)).not.toBeInTheDocument();
});

// ---------------------------------------------------------------------------
// 5. Pre-seeded list
// ---------------------------------------------------------------------------

/** When listContracts returns contracts on mount, the list renders immediately. */
it('renders pre-existing contracts without showing the empty state', () => {
  mockList.mockReturnValue([CONTRACT_FIXTURE]);

  render(<ContractsPage />);

  expect(screen.getByText('Design Sprint')).toBeInTheDocument();
  expect(screen.queryByText(/no contracts found/i)).not.toBeInTheDocument();
});

/** Pre-seeded list shows the "Create Contract" button in the list header toolbar. */
it('shows a "Create Contract" button in the list toolbar when contracts exist', () => {
  mockList.mockReturnValue([CONTRACT_FIXTURE]);

  render(<ContractsPage />);

  expect(screen.getByRole('button', { name: 'Create Contract' })).toBeInTheDocument();
});

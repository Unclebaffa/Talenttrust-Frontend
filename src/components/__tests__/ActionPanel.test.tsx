import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ActionPanel from '../ActionPanel';
import { useWallet } from '@/contexts/WalletContext';
import { useToast } from '@/components/toast/toast-provider';

const mockShowSuccess = jest.fn();

jest.mock('@/components/toast/toast-provider', () => ({
  useToast: jest.fn(() => ({
    showSuccess: mockShowSuccess,
  })),
}));

const mockUseWallet = jest.mocked(useWallet);
const mockUseToast = jest.mocked(useToast);

describe('ActionPanel', () => {
  beforeEach(() => {
    mockShowSuccess.mockClear();
    mockUseToast.mockReturnValue({
      showSuccess: mockShowSuccess,
      showError: jest.fn(),
      toasts: [],
      dismissToast: jest.fn(),
    });
    mockUseWallet.mockReturnValue({
      address: '0x123',
      isConnecting: false,
      error: null,
      connect: jest.fn(),
      disconnect: jest.fn(),
    });
  });

  it('renders Active actions when status is Active', () => {
    const onSubmitMilestone = jest.fn();
    const onReleaseFunds = jest.fn();
    const onDispute = jest.fn();

    render(
      <ActionPanel
        status="Active"
        onSubmitMilestone={onSubmitMilestone}
        onReleaseFunds={onReleaseFunds}
        onDispute={onDispute}
      />
    );

    expect(screen.getByRole('button', { name: /Submit milestone/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Release funds/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Dispute/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Submit milestone/i }));

    const dialog = screen.getByRole('dialog', { name: /confirm submit milestone/i });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveTextContent(
      'Are you sure you want to submit this milestone for approval? This action cannot be undone.'
    );

    fireEvent.click(within(dialog).getByRole('button', { name: /Submit Milestone/i }));

    expect(onSubmitMilestone).toHaveBeenCalledTimes(1);
    expect(mockShowSuccess).toHaveBeenCalledTimes(1);
    expect(mockShowSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Milestone submitted',
      })
    );
    expect(onSubmitMilestone.mock.invocationCallOrder[0]).toBeLessThan(
      mockShowSuccess.mock.invocationCallOrder[0]
    );

    // Release Funds opens a confirmation dialog — confirm it
    fireEvent.click(screen.getByRole('button', { name: /Release funds/i }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /Release Funds/i }));
    expect(onReleaseFunds).toHaveBeenCalledTimes(1);

    // Dispute opens a confirmation dialog — confirm it
    fireEvent.click(screen.getByRole('button', { name: /Dispute/i }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /Dispute/i }));
    expect(onDispute).toHaveBeenCalledTimes(1);
  });

  it('opens the submit confirmation dialog with accessible labels and traps focus', async () => {
    const user = userEvent.setup();

    render(
      <ActionPanel
        status="Active"
        onSubmitMilestone={jest.fn()}
        onReleaseFunds={jest.fn()}
        onDispute={jest.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: /submit milestone/i }));

    const dialog = screen.getByRole('dialog', { name: /confirm submit milestone/i });
    const cancelButton = within(dialog).getByRole('button', { name: /cancel/i });
    const confirmButton = within(dialog).getByRole('button', { name: /submit milestone/i });

    expect(cancelButton).toHaveFocus();
    expect(confirmButton).toBeInTheDocument();

    await user.tab();
    expect(confirmButton).toHaveFocus();

    await user.tab();
    expect(cancelButton).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: /confirm submit milestone/i })).not.toBeInTheDocument();
  });

  it('keeps actions in a logical keyboard tab order with visible focus rings', () => {
    render(
      <ActionPanel
        status="Active"
        onSubmitMilestone={jest.fn()}
        onReleaseFunds={jest.fn()}
        onDispute={jest.fn()}
      />
    );

    const panel = screen.getByRole('complementary', { name: /what would you like to do/i });
    const buttons = within(panel).getAllByRole('button');

    expect(buttons.map((button) => button.textContent)).toEqual([
      'Submit Milestone',
      'Release Funds',
      'Dispute',
    ]);

    buttons.forEach((button) => {
      expect(button).not.toHaveAttribute('tabindex', '-1');
      expect(button).toHaveClass('focus-visible:outline');
      expect(button).toHaveClass('focus-visible:outline-4');
      expect(button).toHaveClass('focus-visible:outline-offset-2');
      button.focus();
      expect(button).toHaveFocus();
    });
  });

  it('renders unavailable actions as disabled controls with accessible reasons', () => {
    const onDispute = jest.fn();

    render(
      <ActionPanel
        status="Pending"
        onDispute={onDispute}
        disabledReasons={{
          releaseFunds: 'Connect a wallet with client permissions to release funds.',
        }}
      />
    );

    const releaseFunds = screen.getByRole('button', { name: /release funds to the contractor/i });
    const dispute = screen.getByRole('button', { name: /open a dispute/i });

    expect(releaseFunds).toBeDisabled();
    expect(releaseFunds).toHaveAccessibleDescription(
      'Connect a wallet with client permissions to release funds.'
    );

    fireEvent.click(releaseFunds);

    // Dispute button opens a confirmation dialog — confirm it
    fireEvent.click(dispute);
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /Dispute/i }));

    expect(onDispute).toHaveBeenCalledTimes(1);
  });

  it('keeps submit milestone disabled when the wallet is disconnected', () => {
    mockUseWallet.mockReturnValue({
      address: null,
      isConnecting: false,
      error: null,
      connect: jest.fn(),
      disconnect: jest.fn(),
    });

    const onSubmitMilestone = jest.fn();

    render(<ActionPanel status="Active" onSubmitMilestone={onSubmitMilestone} />);

    const submitButton = screen.getByRole('button', { name: /submit milestone for approval/i });

    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveAttribute('title', 'Connect wallet to perform this action');

    fireEvent.click(submitButton);

    expect(onSubmitMilestone).not.toHaveBeenCalled();
    expect(mockShowSuccess).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('returns focus to the destructive trigger when confirmation is cancelled', () => {
    render(
      <ActionPanel
        status="Active"
        onReleaseFunds={jest.fn()}
        onDispute={jest.fn()}
      />
    );

    const releaseFunds = screen.getByRole('button', { name: /release funds to the contractor/i });

    fireEvent.click(releaseFunds);
    fireEvent.click(within(screen.getByRole('dialog', { name: /confirm release funds/i })).getByRole('button', { name: /cancel/i }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(releaseFunds).toHaveFocus();
  });

  it('disables visible actions while loading contract data', () => {
    const onSubmitMilestone = jest.fn();

    render(<ActionPanel status="Active" onSubmitMilestone={onSubmitMilestone} isLoading />);

    const buttons = screen.getAllByRole('button');

    expect(buttons).toHaveLength(3);
    buttons.forEach((button) => {
      expect(button).toBeDisabled();
      expect(button).toHaveAccessibleDescription('Action is disabled while contract data is loading.');
    });

    fireEvent.click(screen.getByRole('button', { name: /submit milestone for approval/i }));
    expect(onSubmitMilestone).not.toHaveBeenCalled();
  });

  it('announces action panel errors without changing keyboard order', () => {
    render(
      <ActionPanel
        status="Disputed"
        onDispute={jest.fn()}
        errorMessage="Network is slow. Try again in a moment."
      />
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Network is slow. Try again in a moment.');
    expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual(['Dispute']);
  });

  it('renders View Summary action for Completed status', () => {
    const onViewSummary = jest.fn();
    render(<ActionPanel status="Completed" onViewSummary={onViewSummary} />);

    expect(screen.getByRole('button', { name: /View contract summary details/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /View contract summary details/i }));
    expect(onViewSummary).toHaveBeenCalledTimes(1);
  });
});

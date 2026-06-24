import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WalletConnectButton } from '../WalletConnectButton';
import { WalletContextType, useWallet } from '@/contexts/WalletContext';
import * as truncateAddressModule from '@/lib/truncateAddress';
import { testA11y } from '@/test-utils/a11y';

jest.mock('@/contexts/WalletContext', () => ({
  useWallet: jest.fn(),
}));

const mockUseWallet = useWallet as jest.MockedFunction<typeof useWallet>;

describe('WalletConnectButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const defaultMockState: WalletContextType = {
    address: null,
    isConnecting: false,
    error: null,
    connect: jest.fn(),
    disconnect: jest.fn(),
  };

  it('renders "Connect Wallet" button when not connected', () => {
    mockUseWallet.mockReturnValue(defaultMockState);
    render(<WalletConnectButton />);
    const button = screen.getByRole('button', { name: /connect wallet/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it('calls connect when clicked', () => {
    const connectMock = jest.fn();
    mockUseWallet.mockReturnValue({ ...defaultMockState, connect: connectMock });
    render(<WalletConnectButton />);
    fireEvent.click(screen.getByRole('button', { name: /connect wallet/i }));
    expect(connectMock).toHaveBeenCalledTimes(1);
  });

  it('shows loading state when connecting', () => {
    mockUseWallet.mockReturnValue({ ...defaultMockState, isConnecting: true });
    render(<WalletConnectButton />);
    const button = screen.getByRole('button', { name: /connect wallet/i });
    expect(button).toBeDisabled();
    expect(screen.getByText(/connecting\.\.\./i)).toBeInTheDocument();
  });

  it('shows truncated address and disconnect option when connected', () => {
    mockUseWallet.mockReturnValue({ ...defaultMockState, address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F' });
    render(<WalletConnectButton />);

    expect(screen.getByText('0x71C7...976F')).toBeInTheDocument();

    const disconnectBtn = screen.getByRole('button', { name: /disconnect wallet/i });
    expect(disconnectBtn).toBeInTheDocument();
  });

  it('calls disconnect when disconnect button is clicked', () => {
    const disconnectMock = jest.fn();
    mockUseWallet.mockReturnValue({ ...defaultMockState, address: '0x123', disconnect: disconnectMock });
    render(<WalletConnectButton />);

    fireEvent.click(screen.getByRole('button', { name: /disconnect wallet/i }));
    expect(disconnectMock).toHaveBeenCalledTimes(1);
  });

  it('shows error state and retry option', () => {
    const connectMock = jest.fn();
    mockUseWallet.mockReturnValue({ ...defaultMockState, error: 'Failed to connect', connect: connectMock });
    render(<WalletConnectButton />);

    expect(screen.getByText(/connection error/i)).toBeInTheDocument();
    const retryBtn = screen.getByRole('button', { name: /retry wallet connection/i });
    expect(retryBtn).toBeInTheDocument();

    fireEvent.click(retryBtn);
    expect(connectMock).toHaveBeenCalledTimes(1);
  });

  it('copies address to clipboard on copy click', async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockImplementation(() => Promise.resolve()),
      },
    });

    mockUseWallet.mockReturnValue({ ...defaultMockState, address: '0x123' });
    render(<WalletConnectButton />);

    const copyBtn = screen.getByRole('button', { name: /copy address to clipboard/i });
    await act(async () => {
      fireEvent.click(copyBtn);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('0x123');
  });

  it('disables the connect button and renders the spinner while connecting, without leaking other branches', () => {
    mockUseWallet.mockReturnValue({ ...defaultMockState, isConnecting: true });
    render(<WalletConnectButton />);

    const button = screen.getByRole('button', { name: /connect wallet/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-label', 'Connect wallet');
    expect(screen.queryByText(/connection error/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /disconnect wallet/i })).not.toBeInTheDocument();
  });

  it('renders error branch with the correct aria-label on the retry control and no connected/disconnected controls', () => {
    mockUseWallet.mockReturnValue({ ...defaultMockState, error: 'Failed to connect' });
    render(<WalletConnectButton />);

    expect(screen.getByRole('button', { name: 'Retry wallet connection' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /connect wallet/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /disconnect wallet/i })).not.toBeInTheDocument();
  });

  it('renders connected branch with copy and disconnect aria-labels', () => {
    mockUseWallet.mockReturnValue({ ...defaultMockState, address: '0xAbCdEf1234567890aBcDeF1234567890aBCDeF1' });
    render(<WalletConnectButton />);

    expect(screen.getByRole('button', { name: 'Copy address to clipboard' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Disconnect wallet' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Connect wallet' })).not.toBeInTheDocument();
    expect(screen.queryByText(/connection error/i)).not.toBeInTheDocument();
  });

  it('delegates address truncation to the truncateAddress helper', () => {
    const truncateSpy = jest.spyOn(truncateAddressModule, 'truncateAddress');
    const address = '0x71C7656EC7ab88b098defB751B7401B5f6d8976F';
    mockUseWallet.mockReturnValue({ ...defaultMockState, address });

    render(<WalletConnectButton />);

    expect(truncateSpy).toHaveBeenCalledWith(address);
    truncateSpy.mockRestore();
  });

  it('swaps the copy icon to a checkmark and reverts after 2 seconds using fake timers', async () => {
    jest.useFakeTimers();

    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockImplementation(() => Promise.resolve()),
      },
    });

    mockUseWallet.mockReturnValue({ ...defaultMockState, address: '0x123' });
    render(<WalletConnectButton />);

    const copyBtn = screen.getByRole('button', { name: /copy address to clipboard/i });
    const copyIconPathBefore = copyBtn.querySelector('path')?.getAttribute('d');

    await act(async () => {
      fireEvent.click(copyBtn);
    });

    const copyIconPathAfterClick = copyBtn.querySelector('path')?.getAttribute('d');
    expect(copyIconPathAfterClick).not.toEqual(copyIconPathBefore);

    await act(async () => {
      jest.advanceTimersByTime(1999);
    });
    expect(copyBtn.querySelector('path')?.getAttribute('d')).toEqual(copyIconPathAfterClick);

    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    expect(copyBtn.querySelector('path')?.getAttribute('d')).toEqual(copyIconPathBefore);

    jest.useRealTimers();
  });

  it('has no accessibility violations in the connected state', async () => {
    mockUseWallet.mockReturnValue({ ...defaultMockState, address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F' });
    await testA11y(<WalletConnectButton />);
  });

  it('has no accessibility violations in the disconnected state', async () => {
    mockUseWallet.mockReturnValue(defaultMockState);
    await testA11y(<WalletConnectButton />);
  });

  it('has no accessibility violations in the error state', async () => {
    mockUseWallet.mockReturnValue({ ...defaultMockState, error: 'Failed to connect' });
    await testA11y(<WalletConnectButton />);
  });
});
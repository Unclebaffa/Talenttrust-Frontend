// src/contexts/__tests__/WalletContext.test.tsx
// Import React and testing utilities
import React from 'react';
import { render, act, screen } from '@testing-library/react';
import { ToastProvider } from '@/components/toast/toast-provider';
// Ensure we get the real implementation of WalletContext, bypassing any prior mocks
const { WalletProvider, useWallet } = jest.requireActual('@/contexts/WalletContext');

jest.mock('@/lib/safeStorage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  checkStorageAvailability: jest.fn().mockReturnValue(true),
  resetCache: jest.fn(),
}));

const MockComponent = () => {
  const { address, connect, disconnect } = useWallet();
  return (
    <div>
      <span data-testid="address">{address ?? 'null'}</span>
      <button onClick={connect}>Connect</button>
      <button onClick={disconnect}>Disconnect</button>
    </div>
  );
};

const MOCK_ADDRESS = 'GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H';

describe('WalletContext persistence', () => {
  const mockStorage = require('@/lib/safeStorage');

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    localStorage.clear();
    // Provide a working requestAccess global that connect() calls
    (global as Record<string, unknown>).requestAccess = jest.fn().mockResolvedValue({
      address: MOCK_ADDRESS,
      error: null,
    });
    Object.defineProperty(window, 'freighter', {
      value: true,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    delete (global as Record<string, unknown>).requestAccess;
    jest.useRealTimers();
  });

  test('rehydrates address from safeStorage on mount', () => {
    (mockStorage.getItem as jest.Mock).mockReturnValue('0xABC');
    render(
      <WalletProvider idleTimeout={0}>
        <MockComponent />
      </WalletProvider>
    );
    expect(screen.getByTestId('address')).toHaveTextContent('0xABC');
    expect(mockStorage.getItem).toHaveBeenCalledWith('wallet_connected_address');
  });

  test('connect stores address in safeStorage', async () => {
    (mockStorage.getItem as jest.Mock).mockReturnValue(null);
    render(
      <WalletProvider idleTimeout={0}>
        <MockComponent />
      </WalletProvider>
    );
    act(() => {
      screen.getByText('Connect').click();
    });
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByTestId('address')).toHaveTextContent(MOCK_ADDRESS);
    expect(mockStorage.setItem).toHaveBeenCalledWith(
      'wallet_connected_address',
      MOCK_ADDRESS
    );
  });

  test('disconnect clears address from safeStorage', async () => {
    (mockStorage.getItem as jest.Mock).mockReturnValue(null);
    render(
      <WalletProvider idleTimeout={0}>
        <MockComponent />
      </WalletProvider>
    );
    act(() => {
      screen.getByText('Connect').click();
    });
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    act(() => {
      screen.getByText('Disconnect').click();
    });
    expect(screen.getByTestId('address')).toHaveTextContent('null');
    expect(mockStorage.removeItem).toHaveBeenCalledWith('wallet_connected_address');
  });

  test('idle timeout disconnects and clears storage', async () => {
    (mockStorage.getItem as jest.Mock).mockReturnValue(null);
    render(
      <ToastProvider>
        <WalletProvider idleTimeout={2000}>
          <MockComponent />
        </WalletProvider>
      </ToastProvider>
    );
    act(() => {
      screen.getByText('Connect').click();
    });
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    expect(screen.getByTestId('address')).toHaveTextContent('null');
    expect(mockStorage.removeItem).toHaveBeenCalledWith('wallet_connected_address');
  });
});

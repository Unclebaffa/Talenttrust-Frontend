import React from 'react';
import { render, act, renderHook } from '@testing-library/react';
import { PreferencesProvider, usePreferences } from '../preferences';
import { resetCache } from '../safeStorage';

describe('PreferencesProvider', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    localStorage.clear();
    resetCache();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('provides default preferences', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <PreferencesProvider>{children}</PreferencesProvider>
    );
    const { result } = renderHook(() => usePreferences(), { wrapper });

    expect(result.current.preferences.theme).toBe('system');
    expect(result.current.preferences.amountFormat).toBe('usd');
  });

  it('updates preferences and persists to localStorage', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <PreferencesProvider>{children}</PreferencesProvider>
    );
    const { result } = renderHook(() => usePreferences(), { wrapper });

    act(() => {
      result.current.updatePreference('theme', 'dark');
    });

    expect(result.current.preferences.theme).toBe('dark');
    const saved = JSON.parse(localStorage.getItem('talenttrust-user-preferences') || '{}');
    expect(saved.theme).toBe('dark');
  });

  it('loads preferences from localStorage on mount', () => {
    localStorage.setItem('talenttrust-user-preferences', JSON.stringify({ theme: 'light', quietMode: true }));

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <PreferencesProvider>{children}</PreferencesProvider>
    );
    const { result } = renderHook(() => usePreferences(), { wrapper });

    // Wait for hydration effect
    act(() => {
      jest.advanceTimersByTime?.(0);
    });

    expect(result.current.preferences.theme).toBe('light');
    expect(result.current.preferences.quietMode).toBe(true);
  });

  it('gracefully handles localStorage.getItem throwing on mount', () => {
    // Mock localStorage to throw on getItem
    jest.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <PreferencesProvider>{children}</PreferencesProvider>
    );
    const { result } = renderHook(() => usePreferences(), { wrapper });

    act(() => {
      jest.advanceTimersByTime?.(0);
    });

    // Should fall back to default preferences without throwing
    expect(result.current.preferences.theme).toBe('system');
  });

  it('gracefully handles localStorage.setItem throwing (quota exceeded)', () => {
    // Mock localStorage to throw on setItem
    const setItemSpy = jest.spyOn(window.localStorage, 'setItem').mockImplementation((key) => {
      if (key === '__storage_test__') {
        return;
      }
      throw new Error('QuotaExceededError');
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <PreferencesProvider>{children}</PreferencesProvider>
    );
    const { result } = renderHook(() => usePreferences(), { wrapper });

    act(() => {
      result.current.updatePreference('theme', 'dark');
    });

    // The React state should still update successfully
    expect(result.current.preferences.theme).toBe('dark');
    expect(setItemSpy).toHaveBeenCalled();
  });

  it('handles completely unavailable/disabled storage on mount and update', () => {
    const originalLocalStorage = window.localStorage;
    // Mock localStorage property to be undefined or throw on access
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new Error('SecurityError: localStorage is disabled');
      },
      configurable: true,
    });

    try {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PreferencesProvider>{children}</PreferencesProvider>
      );
      const { result } = renderHook(() => usePreferences(), { wrapper });

      act(() => {
        jest.advanceTimersByTime?.(0);
      });

      // Default values are still provided
      expect(result.current.preferences.theme).toBe('system');

      // Updating works in memory
      act(() => {
        result.current.updatePreference('theme', 'light');
      });
      expect(result.current.preferences.theme).toBe('light');
    } finally {
      Object.defineProperty(window, 'localStorage', {
        value: originalLocalStorage,
        configurable: true,
        writable: true,
      });
    }
  });
});


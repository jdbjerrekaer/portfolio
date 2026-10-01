import { useState, useEffect, useContext, useRef } from 'react';
import { UserRoleContext } from "../UserRoleContext";

const CURRENCY_CHANGE_EVENT = 'ADT_CURRENCY_CHANGED';
const CURRENCY_STORAGE_KEY = 'ADT_SELECTED_CURRENCY';
const DEFAULT_CURRENCY = 'EUR';

/**
 * Custom hook for managing currency state across microfrontends
 * @returns {[string, (currency: string) => void]} Tuple of [currency, setCurrency]
 */
export const useCurrency = (): [string, (currency: string) => void] => {
  const { userInfo } = useContext(UserRoleContext);
  const userId = userInfo?.userId || userInfo?.adminUserId || undefined;
  const storageKey = userId ? `${CURRENCY_STORAGE_KEY}.${userId}` : CURRENCY_STORAGE_KEY;
  const prevStorageKeyRef = useRef(storageKey);

  const [currency, setCurrency] = useState<string>(() => {
    try {
      if (typeof window === 'undefined') {
        return DEFAULT_CURRENCY;
      }
      const stored = localStorage.getItem(storageKey);
      return stored || DEFAULT_CURRENCY;
    } catch (error) {
      console.warn('Failed to get currency from localStorage:', error);
      return DEFAULT_CURRENCY;
    }
  });

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const prevStorageKey = prevStorageKeyRef.current;
      prevStorageKeyRef.current = storageKey;

      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setCurrency(stored);
        return;
      }

      if (prevStorageKey === CURRENCY_STORAGE_KEY && storageKey !== CURRENCY_STORAGE_KEY) {
        const legacy = localStorage.getItem(CURRENCY_STORAGE_KEY);
        if (legacy) {
          setCurrency(legacy);
          return;
        }
      }

      setCurrency(DEFAULT_CURRENCY);
    } catch (error) {
      console.warn('Failed to re-read currency from localStorage:', error);
    }
  }, [storageKey]);

  useEffect(() => {
    const handleCurrencyChange = (e: CustomEvent) => {
      const newCurrency = e.detail?.currency || DEFAULT_CURRENCY;
      setCurrency(newCurrency);
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === storageKey) {
        setCurrency(e.newValue || DEFAULT_CURRENCY);
      }
    };

    window.addEventListener(CURRENCY_CHANGE_EVENT, handleCurrencyChange as EventListener);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener(CURRENCY_CHANGE_EVENT, handleCurrencyChange as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [storageKey]);

  const setCurrencyWithPersistence = (newCurrency: string) => {
    setCurrency(newCurrency);

    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, newCurrency);
      }
    } catch (error) {
      console.warn('Failed to save currency to localStorage:', error);
    }

    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(CURRENCY_CHANGE_EVENT, {
          detail: { currency: newCurrency }
        }));
      }
    } catch (error) {
      console.warn('Failed to dispatch currency change event:', error);
    }
  };

  return [currency, setCurrencyWithPersistence];
};

"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type {
  BootstrapData,
  CreateDebtPaymentInput,
  CreateTransactionInput,
  DebtPayment,
  ProductInput,
  StoreProfile,
  StoreSettings,
  Transaction,
} from "@/lib/types";
import { useAuth } from "@/components/providers/auth-provider";

type DataContextValue = {
  data: BootstrapData | null;
  isReady: boolean;
  isMutating: boolean;
  refresh: () => Promise<void>;
  createTransaction: (input: CreateTransactionInput) => Promise<Transaction>;
  createProduct: (input: ProductInput) => Promise<void>;
  updateProduct: (id: string, input: ProductInput) => Promise<void>;
  restockProduct: (id: string, qty: number) => Promise<void>;
  createDebtPayment: (input: CreateDebtPaymentInput) => Promise<void>;
  updateSettings: (input: { profile: StoreProfile; settings: StoreSettings }) => Promise<void>;
  resetWorkspace: () => Promise<void>;
};

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const [data, setData] = useState<BootstrapData | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isMutating, setIsMutating] = useState(false);

  const refresh = useCallback(async () => {
    const next = await api.getBootstrap();
    setData(next);
  }, []);

  useEffect(() => {
    if (status === "loading") {
      setIsReady(false);
      return;
    }

    if (status === "guest") {
      setData(null);
      setIsReady(true);
      return;
    }

    let mounted = true;
    setIsReady(false);

    async function bootstrap() {
      const next = await api.getBootstrap();
      if (!mounted) {
        return;
      }

      setData(next);
      setIsReady(true);
    }

    bootstrap().catch(() => {
      if (!mounted) {
        return;
      }

      setData(null);
      setIsReady(true);
    });

    return () => {
      mounted = false;
    };
  }, [status]);

  const runMutation = useCallback(
    async <T,>(callback: () => Promise<T>) => {
      setIsMutating(true);
      try {
        const result = await callback();
        await refresh();
        return result;
      } finally {
        setIsMutating(false);
      }
    },
    [refresh],
  );

  const value = useMemo<DataContextValue>(
    () => ({
      data,
      isReady,
      isMutating,
      refresh,
      createTransaction: async (input) => runMutation(() => api.createTransaction(input)),
      createProduct: async (input) => {
        await runMutation(() => api.createProduct(input));
      },
      updateProduct: async (id, input) => {
        await runMutation(() => api.updateProduct(id, input));
      },
      restockProduct: async (id, qty) => {
        await runMutation(() => api.restockProduct(id, qty));
      },
      createDebtPayment: async (input) => {
        await runMutation(() => api.createDebtPayment(input));
      },
      updateSettings: async (input) => {
        await runMutation(() => api.updateSettings(input));
      },
      resetWorkspace: async () => {
        await runMutation(() => api.resetWorkspace());
      },
    }),
    [data, isMutating, isReady, refresh, runMutation],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData harus dipakai di dalam DataProvider.");
  }

  return context;
}

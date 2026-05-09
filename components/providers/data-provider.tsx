"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type {
  Category,
  CategoryInput,
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
  createCategory: (input: CategoryInput) => Promise<Category>;
  updateCategory: (id: string, input: CategoryInput) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  resetWorkspace: () => Promise<void>;
};

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ 
  children, 
  initialData 
}: { 
  children: React.ReactNode;
  initialData?: BootstrapData | null;
}) {
  const { status } = useAuth();
  const [data, setData] = useState<BootstrapData | null>(initialData || null);
  const [isReady, setIsReady] = useState(!!initialData);
  const [isMutating, setIsMutating] = useState(false);

  const refresh = useCallback(async () => {
    const next = await api.getBootstrap();
    setData(next);
  }, []);

  useEffect(() => {
    // If we have initial data, we're already ready
    if (initialData && !data) {
      setData(initialData);
      setIsReady(true);
      return;
    }

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
      createCategory: async (input) => runMutation(() => api.createCategory(input)),
      updateCategory: async (id, input) => {
        await runMutation(() => api.updateCategory(id, input));
      },
      deleteCategory: async (id) => {
        await runMutation(() => api.deleteCategory(id));
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

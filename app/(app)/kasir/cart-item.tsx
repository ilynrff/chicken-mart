"use client";

import * as React from "react";
import { Trash2, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/lib/types";

interface CartItemProps {
  product: Product;
  qty: number;
  subtotal: number;
  onUpdateQty: (productId: string, nextQty: number) => void;
}

export const CartItem = React.memo(({ product, qty, subtotal, onUpdateQty }: CartItemProps) => {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/5 bg-black/20 p-4 transition-colors hover:bg-white/5">
      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white truncate">{product.name}</p>
          <p className="text-xs text-slate-400 mt-1">{formatCurrency(product.sellPrice)} / item</p>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => onUpdateQty(product.id, 0)} 
          className="h-7 w-7 text-slate-500 hover:text-red-400"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <div className="flex items-center gap-1 rounded-lg bg-white/5 p-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 text-slate-300" 
            onClick={() => onUpdateQty(product.id, qty - 1)}
          >
            <Minus className="size-3" />
          </Button>
          <span className="w-6 text-center text-xs font-bold text-white">{qty}</span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 text-slate-300" 
            onClick={() => onUpdateQty(product.id, qty + 1)}
          >
            <Plus className="size-3" />
          </Button>
        </div>

        <div className="text-right">
          <p className="text-sm font-bold text-white">{formatCurrency(subtotal)}</p>
          {qty > product.stock && (
            <p className="text-[10px] text-red-400 mt-0.5 font-medium">Melebihi stok ({product.stock})</p>
          )}
        </div>
      </div>
    </div>
  );
});

CartItem.displayName = "CartItem";

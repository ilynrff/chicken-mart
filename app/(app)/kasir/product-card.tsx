"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import type { Product } from "@/lib/types";

interface ProductCardProps {
  product: Product;
  onAdd: (productId: string) => void;
}

export const ProductCard = React.memo(({ product, onAdd }: ProductCardProps) => {
  const isLow = product.stock <= product.minimumStock;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="will-change-transform"
    >
      <Card className="h-full flex flex-col group border-white/5 bg-[#161618] p-4 rounded-xl transition-all duration-200 hover:translate-y-[-2px] hover:border-red-500/20 hover:shadow-[0_8px_30px_rgba(229,57,53,0.06)]">
        <div className="flex-1 min-w-0 mb-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">{product.category}</p>
          <h3 className="line-clamp-2 text-sm font-semibold text-white mb-1.5">{product.name}</h3>
          <p className="text-lg font-bold text-white">{formatCurrency(product.sellPrice)}</p>
        </div>

        <div className="flex items-center justify-between text-xs mb-3 border-t border-white/5 pt-3">
          <span className={cn(
            "px-2 py-0.5 rounded text-[10px] font-bold tracking-wider", 
            isLow ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400"
          )}>
            Stok: {product.stock}
          </span>
          <span className="text-slate-500">Min {product.minimumStock}</span>
        </div>

        <Button
          className="w-full h-10 text-xs shadow-none border-white/10 bg-white/10 text-white hover:bg-white/20 transition-all rounded-xl active:scale-[0.98]"
          onClick={() => onAdd(product.id)}
          disabled={product.stock === 0}
        >
          <Plus className="size-3 mr-2" />
          {product.stock === 0 ? "Habis" : "Tambah"}
        </Button>
      </Card>
    </motion.div>
  );
});

ProductCard.displayName = "ProductCard";

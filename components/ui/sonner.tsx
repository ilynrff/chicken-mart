"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[#0a0a0c]/80 group-[.toaster]:backdrop-blur-xl group-[.toaster]:text-white group-[.toaster]:border-red-500/20 group-[.toaster]:shadow-[0_8px_32px_rgba(0,0,0,0.5)] group-[.toaster]:rounded-2xl group-[.toaster]:p-4 group-[.toaster]:border",
          description: "group-[.toast]:text-slate-400",
          actionButton:
            "group-[.toast]:bg-red-600 group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-white/10 group-[.toast]:text-white",
          closeButton:
            "group-[.toast]:bg-white/10 group-[.toast]:text-white group-[.toast]:border-white/10 hover:group-[.toast]:bg-white/20 transition-colors",
          success: "group-[.toast]:border-emerald-500/30",
          error: "group-[.toast]:border-red-500/30",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }

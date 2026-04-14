import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "APPROVED" | "HOLD" | "REJECTED" | "DEFAULT" | "REQUESTED" | "BLOCKED"
  children?: React.ReactNode
  className?: string
}

export function Badge({ className, variant = "DEFAULT", ...props }: BadgeProps) {
  const variantStyles = {
    APPROVED: "bg-emerald-100 text-emerald-800 border-emerald-200",
    HOLD: "bg-amber-100 text-amber-800 border-amber-200",
    REJECTED: "bg-rose-100 text-rose-800 border-rose-200",
    REQUESTED: "bg-indigo-100 text-indigo-800 border-indigo-200",
    BLOCKED: "bg-slate-800 text-slate-100 border-slate-900",
    DEFAULT: "bg-slate-100 text-slate-800 border-slate-200",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
}

import * as React from "react"
import { cn } from "@/lib/utils"

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  className?: string
}

export function ProgressBar({ className, value, max = 100, ...props }: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  
  let colorClass = "bg-emerald-500"
  if (value < 50) colorClass = "bg-rose-500"
  else if (value < 80) colorClass = "bg-amber-500"

  return (
    <div
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-slate-100", className)}
      {...props}
    >
      <div
        className={cn("h-full w-full flex-1 transition-all duration-500 ease-in-out", colorClass)}
        style={{ transform: `translateX(-${100 - percentage}%)` }}
      />
    </div>
  )
}

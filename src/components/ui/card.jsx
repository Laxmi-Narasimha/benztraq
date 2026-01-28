import * as React from "react"

import { cn } from "@/lib/utils"

function Card({
  className,
  hover = false,
  accent,
  ...props
}) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-white dark:bg-stone-900 text-card-foreground flex flex-col rounded-2xl border border-stone-200/80 dark:border-stone-800",
        "shadow-premium transition-all duration-200",
        hover && "hover:shadow-premium-lg hover:border-stone-300/80 dark:hover:border-stone-700 cursor-pointer",
        accent === "teal" && "border-l-4 border-l-teal-500",
        accent === "amber" && "border-l-4 border-l-amber-500",
        accent === "emerald" && "border-l-4 border-l-emerald-500",
        accent === "rose" && "border-l-4 border-l-rose-500",
        accent === "violet" && "border-l-4 border-l-violet-500",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({
  className,
  ...props
}) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "flex flex-col gap-1.5 p-6 pb-2",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({
  className,
  ...props
}) {
  return (
    <h3
      data-slot="card-title"
      className={cn(
        "text-lg font-semibold leading-tight tracking-tight text-stone-800 dark:text-white",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({
  className,
  ...props
}) {
  return (
    <p
      data-slot="card-description"
      className={cn(
        "text-sm text-stone-500 dark:text-stone-400",
        className
      )}
      {...props}
    />
  )
}

function CardAction({
  className,
  ...props
}) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "flex items-center gap-2",
        className
      )}
      {...props}
    />
  )
}

function CardContent({
  className,
  ...props
}) {
  return (
    <div
      data-slot="card-content"
      className={cn("p-6 pt-2", className)}
      {...props}
    />
  )
}

function CardFooter({
  className,
  ...props
}) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center p-6 pt-2 border-t border-stone-100 dark:border-stone-800",
        className
      )}
      {...props}
    />
  )
}

// Premium stat card for dashboards
function StatCard({
  icon: Icon,
  iconColor = "teal",
  title,
  value,
  change,
  changeLabel,
  className,
  ...props
}) {
  const iconColorClasses = {
    teal: "icon-container-teal",
    amber: "icon-container-amber",
    violet: "icon-container-violet",
    emerald: "icon-container-emerald",
    rose: "icon-container-rose",
  }

  return (
    <Card className={cn("p-6", className)} {...props}>
      <div className="flex items-start justify-between">
        <div className={cn("icon-container icon-container-lg", iconColorClasses[iconColor])}>
          {Icon && <Icon className="w-6 h-6" />}
        </div>
        {change !== undefined && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
            change >= 0
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
              : "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
          )}>
            <span>{change >= 0 ? '↑' : '↓'} {Math.abs(change)}%</span>
          </div>
        )}
      </div>
      <div className="mt-4 space-y-1">
        <p className="text-sm font-medium text-stone-500 dark:text-stone-400">{title}</p>
        <p className="stat-number">{value}</p>
        {changeLabel && (
          <p className="text-xs text-stone-400 dark:text-stone-500">{changeLabel}</p>
        )}
      </div>
    </Card>
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  StatCard,
}

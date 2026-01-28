import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef(({
  className,
  type,
  icon: Icon,
  iconPosition = "left",
  ...props
}, ref) => {
  if (Icon) {
    return (
      <div className="relative">
        <div className={cn(
          "absolute top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500",
          iconPosition === "left" ? "left-3" : "right-3"
        )}>
          <Icon className="w-4 h-4" />
        </div>
        <input
          type={type}
          ref={ref}
          data-slot="input"
          className={cn(
            // Base styles
            "w-full min-w-0 rounded-xl border bg-white text-base transition-all duration-200 outline-none",
            "dark:bg-stone-900",
            // Size & spacing
            "h-11 px-4 py-2.5",
            iconPosition === "left" && "pl-10",
            iconPosition === "right" && "pr-10",
            // Border & shadow
            "border-stone-200 dark:border-stone-700",
            "shadow-sm",
            // Focus states
            "focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10",
            "dark:focus:border-teal-400 dark:focus:ring-teal-400/10",
            // Hover state
            "hover:border-stone-300 dark:hover:border-stone-600",
            // Placeholder
            "placeholder:text-stone-400 dark:placeholder:text-stone-500",
            // Text
            "text-stone-800 dark:text-stone-100",
            "md:text-sm",
            // File input
            "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-stone-700 dark:file:text-stone-300",
            // Disabled
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-stone-50 dark:disabled:bg-stone-800",
            // Invalid
            "aria-invalid:border-rose-500 aria-invalid:ring-rose-500/10",
            className
          )}
          {...props}
        />
      </div>
    )
  }

  return (
    <input
      type={type}
      ref={ref}
      data-slot="input"
      className={cn(
        // Base styles
        "w-full min-w-0 rounded-xl border bg-white text-base transition-all duration-200 outline-none",
        "dark:bg-stone-900",
        // Size & spacing
        "h-11 px-4 py-2.5",
        // Border & shadow
        "border-stone-200 dark:border-stone-700",
        "shadow-sm",
        // Focus states
        "focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10",
        "dark:focus:border-teal-400 dark:focus:ring-teal-400/10",
        // Hover state
        "hover:border-stone-300 dark:hover:border-stone-600",
        // Placeholder
        "placeholder:text-stone-400 dark:placeholder:text-stone-500",
        // Text
        "text-stone-800 dark:text-stone-100",
        "md:text-sm",
        // File input
        "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-stone-700 dark:file:text-stone-300",
        // Disabled
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-stone-50 dark:disabled:bg-stone-800",
        // Invalid
        "aria-invalid:border-rose-500 aria-invalid:ring-rose-500/10",
        className
      )}
      {...props}
    />
  )
})

Input.displayName = "Input"

// Textarea component with same styling
const Textarea = React.forwardRef(({
  className,
  ...props
}, ref) => {
  return (
    <textarea
      ref={ref}
      data-slot="textarea"
      className={cn(
        // Base styles
        "w-full min-w-0 rounded-xl border bg-white text-base transition-all duration-200 outline-none resize-none",
        "dark:bg-stone-900",
        // Size & spacing
        "min-h-[120px] px-4 py-3",
        // Border & shadow
        "border-stone-200 dark:border-stone-700",
        "shadow-sm",
        // Focus states
        "focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10",
        "dark:focus:border-teal-400 dark:focus:ring-teal-400/10",
        // Hover state
        "hover:border-stone-300 dark:hover:border-stone-600",
        // Placeholder
        "placeholder:text-stone-400 dark:placeholder:text-stone-500",
        // Text
        "text-stone-800 dark:text-stone-100",
        "md:text-sm",
        // Disabled
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-stone-50 dark:disabled:bg-stone-800",
        // Invalid
        "aria-invalid:border-rose-500 aria-invalid:ring-rose-500/10",
        className
      )}
      {...props}
    />
  )
})

Textarea.displayName = "Textarea"

// Search input with built-in icon
const SearchInput = React.forwardRef(({
  className,
  ...props
}, ref) => {
  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        type="search"
        ref={ref}
        data-slot="search-input"
        className={cn(
          // Base
          "w-full rounded-xl border bg-white transition-all duration-200 outline-none",
          "dark:bg-stone-900",
          // Size
          "h-10 pl-10 pr-4 py-2",
          // Border
          "border-stone-200 dark:border-stone-700",
          // Focus
          "focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10",
          // Placeholder
          "placeholder:text-stone-400 dark:placeholder:text-stone-500",
          // Text
          "text-sm text-stone-800 dark:text-stone-100",
          className
        )}
        {...props}
      />
    </div>
  )
})

SearchInput.displayName = "SearchInput"

export { Input, Textarea, SearchInput }

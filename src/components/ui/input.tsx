import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    if (type === "number") {
      e.currentTarget.blur();
    }
  };

  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Base styles
        "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors",

        // File input styles
        "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        
        // Placeholder & Disabled styles
        "placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
        
        // Focus & Validation styles (using shadcn variables)
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:shadow-none aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
        
        // Dark mode specific adjustments
        "dark:aria-invalid:ring-destructive/40 dark:aria-invalid:border-destructive/50",
        
        className
      )}
      onWheel={handleWheel}
      {...props}
    />
  )
}

export { Input }

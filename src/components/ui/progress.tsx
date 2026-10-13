import * as React from "react";
import { cn } from "cn";

function Progress({ value, className, "aria-label": ariaLabel, ...props }: React.ComponentProps<"div"> & { value: number; "aria-label"?: string }) {
  const progress = Math.min(100, Math.max(0, value));

  return (
    <div
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}
      {...props}
    >
      <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
    </div>
  );
}

export { Progress };

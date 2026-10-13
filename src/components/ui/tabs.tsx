"use client";

import * as React from "react";
import { cn } from "cn";

type TabItem = {
  value: string;
  label: React.ReactNode;
};

type TabsProps = {
  items: TabItem[];
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
};

function Tabs({ items, value, onValueChange, children, className }: TabsProps) {
  const tabIds = React.useId();
  const tabRefs = React.useRef<Array<HTMLButtonElement | null>>([]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!items.length) return;
    let nextIndex: number | undefined;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % items.length;
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + items.length) % items.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = items.length - 1;
    if (nextIndex === undefined) return;

    event.preventDefault();
    onValueChange(items[nextIndex].value);
    tabRefs.current[nextIndex]?.focus();
  };

  return (
    <div className={cn("flex w-full flex-col gap-4", className)}>
      <div role="tablist" className="flex w-full border-b">
        {items.map((item, index) => {
          const selected = item.value === value;
          return (
            <button
              key={item.value}
              id={`${tabIds}-${item.value}`}
              ref={(element) => { tabRefs.current[index] = element; }}
              aria-label={typeof item.label === "string" ? item.label : undefined}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`${tabIds}-panel-${item.value}`}
              tabIndex={selected ? 0 : -1}
              className={cn(
                "-mb-px flex-1 border-b-2 px-4 py-2 text-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
              )}
              onClick={() => onValueChange(item.value)}
              onKeyDown={(event) => handleKeyDown(event, index)}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <div
        id={`${tabIds}-panel-${value}`}
        role="tabpanel"
        aria-labelledby={`${tabIds}-${value}`}
        tabIndex={0}
        className="focus-visible:outline-none"
      >
        {children}
      </div>
    </div>
  );
}

export { Tabs };

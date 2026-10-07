"use client";

import { useEffect, useState } from "react";
import { useCarousel } from "@/components/ui/carousel";

interface CarouselDotsProps {
  className?: string;
}

export function CarouselDots({ className = "" }: CarouselDotsProps) {
  const { api } = useCarousel();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  useEffect(() => {
    if (!api) return;

    setScrollSnaps(api.scrollSnapList());
    setSelectedIndex(api.selectedScrollSnap());

    api.on("select", () => {
      setSelectedIndex(api.selectedScrollSnap());
    });
  }, [api]);

  return (
    <div className={`absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2 ${className}`}>
      {scrollSnaps.map((_, index) => (
        <button
          key={index}
          onClick={() => api?.scrollTo(index)}
          className={`h-2 rounded-full transition-all duration-300 ${
            index === selectedIndex
              ? "w-6 bg-primary-foreground"
              : "w-2 bg-primary-foreground/40 hover:bg-primary-foreground/75"
          }`}
          aria-label={`Go to slide ${index + 1}`}
        />
      ))}
    </div>
  );
}
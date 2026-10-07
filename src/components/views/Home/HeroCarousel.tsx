"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { CarouselDots } from "@/components/shared/CarouselDots";

const slides = [
  {
    eyebrow: "AGITEK PC",
    title: "Build Your Dream PC",
    description: "Powerful performance for every battle and every project.",
    image: "/images/no-image.png",
  },
  {
    eyebrow: "LIMITED OFFER",
    title: "Upgrade Your Setup",
    description: "Discover new components with special launch offers.",
    image: "/images/no-image.png",
  },
  {
    eyebrow: "GAMING READY",
    title: "Play Without Limits",
    description: "Find a configuration made for your favorite games.",
    image: "/images/no-image.png",
  },
];

export default function HeroCarousel() {
  const t = useTranslations("Home");

  return (
    <Carousel
      opts={{ loop: true }}
      className="w-full overflow-hidden rounded-[2rem]"
    >
      <CarouselContent className="ml-0">
        {slides.map((slide) => (
          <CarouselItem key={slide.title} className="pl-0">
            <section className="relative min-h-90 md:min-h-105">
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                priority
                className="object-cover"
                unoptimized
              />
              <div className="absolute inset-0 bg-linear-to-r from-primary/90 via-primary/70 to-primary/30" />
              <div className="relative flex h-full items-center p-8 md:p-14">
                <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="max-w-xl text-primary-foreground">
                  <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-primary-foreground/70">{slide.eyebrow}</p>
                  <h1 className="text-4xl font-black tracking-tight md:text-6xl">{slide.title}</h1>
                  <p className="mt-4 max-w-md text-primary-foreground/85 md:text-lg">{slide.description}</p>
                  <Button className="mt-7" size="lg">{t("learnMore")}</Button>
                </motion.div>
              </div>
            </section>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="left-4" variant="secondary" />
      <CarouselNext className="right-4" variant="secondary" />
      <CarouselDots />
    </Carousel>
  );
}

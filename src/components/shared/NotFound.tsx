"use client";

import Link from "next/link";
import { Button } from "../ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-32 text-center">
      <h1 className="text-8xl md:text-9xl font-bold text-blue-500 tracking-tight animate-bounce">
        404
      </h1>

      <h2 className="mt-4 text-2xl md:text-3xl font-semibold text-blue-950">
        This page doesn&apos;t exist
      </h2>

      <p className="mt-2 text-gray-500 max-w-md">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>

      <div className="mt-8">
        <Link href="/">
          <Button size="lg" className="rounded-full bg-blue-500 hover:bg-blue-600 text-white">
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}

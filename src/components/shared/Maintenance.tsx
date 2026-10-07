"use client";

import Link from "next/link";
import { Button } from "../ui/button";

export default function Maintenance() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-32 text-center">
      <h1 className="text-8xl md:text-9xl font-bold text-orange-500 tracking-tight animate-bounce">
        503
      </h1>

      <h2 className="mt-4 text-2xl md:text-3xl font-semibold text-blue-950">
        Service Unavailable
      </h2>

      <p className="mt-2 text-gray-500 max-w-md">
        We apologize for the inconvenience. Our servers are currently undergoing maintenance or experiencing temporary issues. Please try again later.
      </p>

      <div className="mt-8">
        <Link href="/">
          <Button size="lg" className="rounded-full bg-orange-500 hover:bg-orange-600 text-white">
            Về trang chủ
          </Button>
        </Link>
      </div>
    </div>
  );
}

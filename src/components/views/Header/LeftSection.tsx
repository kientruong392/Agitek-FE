import Link from "next/link";

export default function LeftSection() {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <Link href="/" className="flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary font-black text-primary-foreground">A</span>
        <span className="hidden text-lg font-bold tracking-tight sm:inline">Agitek PC</span>
      </Link>
    </div>
  );
}

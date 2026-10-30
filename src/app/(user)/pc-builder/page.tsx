import { auth } from "@/auth";
import { redirect } from "next/navigation";
import PcBuilder from "./components/pc-builder";

export default async function PcBuilderPage() {
  const session = await auth();
  if (!session?.user || session.error) redirect("/login?callbackUrl=%2Fpc-builder");
  if (session.user.role !== "Customer") redirect("/");
  return <PcBuilder key={session.user.id} userId={String(session.user.id)} />;
}

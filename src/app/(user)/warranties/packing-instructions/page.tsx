import { redirect } from "next/navigation";
import { auth } from "@/auth";
import PackingInstructions from "./components/packing-instructions";

export default async function WarrantyPackingInstructionsPage() {
  const session = await auth();
  if (!session?.user || session.error) {
    redirect("/login?callbackUrl=%2Fwarranties%2Fpacking-instructions%2F");
  }

  return <PackingInstructions />;
}

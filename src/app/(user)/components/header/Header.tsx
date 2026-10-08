import { checkLogin } from "@/actions/auth.action";
import LeftSection from "@/app/(user)/components/header/LeftSection";
import MiddleSection from "@/app/(user)/components/header/MiddleSection";
import RightSection from "@/app/(user)/components/header/RightSection";

export default async function Header() {
  const isLogin = await checkLogin();

  return (
    <header className="fixed left-0 top-0 z-50 flex h-14 w-full items-center gap-2 border-b border-border bg-card px-3 text-foreground md:h-16 md:gap-4 md:px-8">
      <LeftSection />
      <MiddleSection />
      <RightSection isLogin={isLogin} />
    </header>
  );
}


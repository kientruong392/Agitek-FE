import Header from "@/app/(user)/components/header/Header";
import Footer from "@/app/(user)/components/Footer";
import { checkLogin } from "@/actions/auth.action";
import { CartProvider } from "@/components/providers/CartProvider";

export default async function UserLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isLogin = await checkLogin();

  return (
    <CartProvider isLogin={isLogin}>
      <Header />
      <main className="min-h-screen bg-background pt-14 md:pt-16 pb-14 md:pb-0">
        {children}
      </main>
      <Footer />
    </CartProvider>
  );
}

import Header from "@/app/(user)/components/header/Header";
import Footer from "@/app/(user)/components/Footer";

export default function UserLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background pt-14 md:pt-16 pb-14 md:pb-0">
        {children}
      </main>
      <Footer />
    </>
  );
}

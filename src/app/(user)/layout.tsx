import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

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
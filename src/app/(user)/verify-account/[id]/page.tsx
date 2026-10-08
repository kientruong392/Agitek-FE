import VerifyAccountForm from "@/app/(user)/verify-account/[id]/components/VerifyAccountForm";

export default async function VerifyAccount({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return (
        <main className="flex items-center justify-center w-full min-h-screen bg-[url('/images/posthub-wallpaper.jpg')] bg-center bg-cover bg-no-repeat">
            <VerifyAccountForm id={id} />
        </main>
    );
}


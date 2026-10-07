import ResetPasswordForm from "@/components/views/Auth/ResetPasswordForm";
import { getTranslations } from "next-intl/server";

export default async function ResetPassword({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { token } = await searchParams;
    const t = await getTranslations('Auth');

    if (!token || typeof token !== "string") {
        return (
            <main className="flex items-center justify-center w-full min-h-[60vh]">
                <div className="text-center text-red-500 font-bold text-xl">
                    {t('invalidResetLink')}
                </div>
            </main>
        );
    }

    return (
        <main className="flex items-center justify-center w-full min-h-screen bg-[url('/images/posthub-wallpaper.jpg')] bg-center bg-cover bg-no-repeat">
            <ResetPasswordForm token={token} />
        </main>
    );
}

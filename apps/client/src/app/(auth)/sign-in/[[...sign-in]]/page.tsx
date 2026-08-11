import type { Metadata } from "next";
import { getServerT } from "@/lib/i18n/server";
import { SignInForm } from "@/components/taranka/sign-in-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT("auth");
  return { title: t("page.signInMetaTitle") };
}

export default function SignInPage() {
  return (
    <div className="mx-auto flex max-w-[1440px] justify-center px-6 py-12 font-taranka-body">
      <SignInForm />
    </div>
  );
}

import type { Metadata } from "next";
import { getServerT } from "@/lib/i18n/server";
import { SignUpForm } from "@/components/taranka/sign-up-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT("auth");
  return { title: t("page.signUpMetaTitle") };
}

export default function SignUpPage() {
  return (
    <div className="mx-auto flex max-w-[1440px] justify-center px-6 py-12 font-taranka-body">
      <SignUpForm />
    </div>
  );
}

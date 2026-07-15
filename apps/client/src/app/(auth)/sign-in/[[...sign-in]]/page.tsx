import type { Metadata } from "next";
import { SignInForm } from "@/components/taranka/sign-in-form";

export const metadata: Metadata = {
  title: "Zaloguj się | Taranka",
};

export default function SignInPage() {
  return (
    <div className="mx-auto flex max-w-[1440px] justify-center px-6 py-12 font-taranka-body">
      <SignInForm />
    </div>
  );
}

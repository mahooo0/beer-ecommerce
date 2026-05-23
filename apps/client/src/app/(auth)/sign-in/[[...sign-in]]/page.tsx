import type { Metadata } from "next";
import { AuthForm } from "@/components/taranka/auth-form";

export const metadata: Metadata = {
  title: "Zaloguj się | Taranka",
};

export default function SignInPage() {
  return (
    <div className="mx-auto flex max-w-[1440px] justify-center px-[120px] py-12 font-taranka-body">
      <AuthForm mode="sign-in" />
    </div>
  );
}

import type { Metadata } from "next";
import { SignUpForm } from "@/components/taranka/sign-up-form";

export const metadata: Metadata = {
  title: "Rejestracja | Taranka",
};

export default function SignUpPage() {
  return (
    <div className="mx-auto flex max-w-[1440px] justify-center px-6 py-12 font-taranka-body">
      <SignUpForm />
    </div>
  );
}

import type { Metadata } from "next";
import { ProfileSidebar } from "@/components/taranka/profile-sidebar";
import { ProfileAccountForm } from "@/components/taranka/profile-account-form";
import { TarankaFooter } from "@/components/taranka/footer";

export const metadata: Metadata = {
  title: "Dane osobowe | Taranka",
};

export default function ProfilePage() {
  return (
    <>
      <div className="mx-auto max-w-[1440px] px-[120px] py-8 font-taranka-body">
        <div className="flex gap-6">
          <ProfileSidebar />
          <ProfileAccountForm />
        </div>
      </div>
      <TarankaFooter />
    </>
  );
}

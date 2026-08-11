import type { Metadata } from "next";
import { ProfileSidebar } from "@/components/taranka/profile-sidebar";
import { ProfileAccountForm } from "@/components/taranka/profile-account-form";
import { TarankaFooter } from "@/components/taranka/footer";
import { getServerT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT("profile");
  return { title: `${t("sidebar.personalData")} | Taranka` };
}

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

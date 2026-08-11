import type { Metadata } from "next";
import { ProfileSidebar } from "@/components/taranka/profile-sidebar";
import { ProfileAddresses } from "@/components/taranka/profile-addresses";
import { TarankaFooter } from "@/components/taranka/footer";
import { getServerT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT("profile");
  return { title: `${t("addresses.title")} | Taranka` };
}

export default function AddressesPage() {
  return (
    <>
      <div className="mx-auto max-w-[1440px] px-[120px] py-8 font-taranka-body">
        <div className="flex gap-6">
          <ProfileSidebar />
          <ProfileAddresses />
        </div>
      </div>
      <TarankaFooter />
    </>
  );
}

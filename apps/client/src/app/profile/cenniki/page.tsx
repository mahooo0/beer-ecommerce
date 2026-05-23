import type { Metadata } from "next";
import { ProfileSidebar } from "@/components/taranka/profile-sidebar";
import { ProfileCenniki } from "@/components/taranka/profile-cenniki";
import { TarankaFooter } from "@/components/taranka/footer";

export const metadata: Metadata = {
  title: "Cenniki | Taranka",
};

export default function CennikiPage() {
  return (
    <>
      <div className="mx-auto max-w-[1440px] px-[120px] py-8 font-taranka-body">
        <div className="flex gap-6">
          <ProfileSidebar />
          <ProfileCenniki />
        </div>
      </div>
      <TarankaFooter />
    </>
  );
}

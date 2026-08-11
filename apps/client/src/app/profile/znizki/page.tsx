import type { Metadata } from "next";
import { ProfileSidebar } from "@/components/taranka/profile-sidebar";
import { ProfileZnizki } from "@/components/taranka/profile-znizki";
import { ContactForm } from "@/components/taranka/contact-form";
import { TarankaFooter } from "@/components/taranka/footer";
import { getServerT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT("profile");
  return { title: `${t("sidebar.discounts")} | Taranka` };
}

export default function ZnizkiPage() {
  return (
    <>
      <div className="mx-auto max-w-[1440px] px-[120px] py-8 font-taranka-body">
        <div className="flex gap-6">
          <ProfileSidebar />
          <ProfileZnizki />
        </div>
      </div>
      <ContactForm />
      <TarankaFooter />
    </>
  );
}

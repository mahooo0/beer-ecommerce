import type { Metadata } from "next";
import { ProfileSidebar } from "@/components/taranka/profile-sidebar";
import { ProfileOrders } from "@/components/taranka/profile-orders";
import { TarankaFooter } from "@/components/taranka/footer";
import { getServerT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT("profile");
  return { title: `${t("orders.title")} | Taranka` };
}

export default function OrdersPage() {
  return (
    <>
      <div className="mx-auto max-w-[1440px] px-[120px] py-8 font-taranka-body">
        <div className="flex gap-6">
          <ProfileSidebar />
          <ProfileOrders />
        </div>
      </div>
      <TarankaFooter />
    </>
  );
}

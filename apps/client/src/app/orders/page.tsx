import type { Metadata } from "next";
import { ProfileSidebar } from "@/components/taranka/profile-sidebar";
import { ProfileOrders } from "@/components/taranka/profile-orders";
import { TarankaFooter } from "@/components/taranka/footer";

export const metadata: Metadata = {
  title: "Historia zamówień | Taranka",
};

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

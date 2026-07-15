import Link from "next/link";

import { siTelegram } from "simple-icons";

import { SimpleIcon } from "@/components/simple-icon";
import { Card, CardDescription, CardHeader } from "@/components/ui/card";

export function SidebarSupportCard() {
  return (
    <Card size="sm" className="shadow-none group-data-[collapsible=icon]:hidden">
      <CardHeader className="px-4">
        <CardDescription>
          Reach out to me on&nbsp;
          <Link
            href="https://t.me/mah00o0"
            target="_blank"
            rel="noreferrer"
            aria-label="Reach out on Telegram"
            className="inline-flex items-center gap-1 text-foreground"
          >
            <SimpleIcon icon={siTelegram} aria-hidden className="size-3 fill-current" />
            @mah00o0
          </Link>
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { getServerT } from "@/lib/i18n/server";

// Landing point for Google/Apple OAuth. Clerk finalizes the flow and sends the
// user to the storefront — phone / account type are set later in /profile.
export default async function SSOCallbackPage() {
  const t = await getServerT("auth");
  return (
    <div className="flex min-h-[40vh] items-center justify-center font-taranka-body text-ink-900/70">
      <AuthenticateWithRedirectCallback
        signUpForceRedirectUrl="/"
        signInForceRedirectUrl="/"
      />
      <p>{t("sso.loading")}</p>
    </div>
  );
}

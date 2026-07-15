import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

// Landing point for Google/Apple OAuth. Clerk finalizes the flow and sends the
// user to the storefront — phone / account type are set later in /profile.
export default function SSOCallbackPage() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center font-taranka-body text-ink-900/70">
      <AuthenticateWithRedirectCallback
        signUpForceRedirectUrl="/"
        signInForceRedirectUrl="/"
      />
      <p>Logowanie…</p>
    </div>
  );
}

import { SignUp } from '@clerk/nextjs';

export default function AdminSignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <SignUp signInUrl="/sign-in" fallbackRedirectUrl="/dashboard" />
    </div>
  );
}

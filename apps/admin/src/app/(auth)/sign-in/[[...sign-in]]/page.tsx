import { SignIn } from '@clerk/nextjs';

export default function AdminSignInPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <SignIn />
    </div>
  );
}

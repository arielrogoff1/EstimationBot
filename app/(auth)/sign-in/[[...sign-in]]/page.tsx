import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-foam-slate to-slate-800 flex items-center justify-center p-4">
      <SignIn />
    </div>
  );
}

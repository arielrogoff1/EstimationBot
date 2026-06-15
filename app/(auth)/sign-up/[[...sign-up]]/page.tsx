import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-foam-slate to-slate-800 flex items-center justify-center p-4">
      <SignUp />
    </div>
  );
}

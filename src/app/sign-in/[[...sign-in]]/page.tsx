import { SignIn } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A2540] p-6">
      <div className="w-full max-w-md">
        <SignIn
          appearance={{
            baseTheme: dark,
            variables: {
              colorPrimary: "#00D4C8",
              colorBackground: "#0A2540",
              colorText: "#FFFFFF",
              colorInputBackground: "#112233",
              colorInputText: "#FFFFFF",
            },
          }}
          path="/sign-in"
          routing="path"
          signUpUrl="/sign-up"
          afterSignInUrl="/dashboard"
        />
      </div>
    </div>
  );
}
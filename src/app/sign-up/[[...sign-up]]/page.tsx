import { SignUp } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

import { clerkPublicAuthConfig } from "@/lib/clerk-public-config";

export default function SignUpPage() {
  const { signInUrl, signUpPath, signUpFallbackRedirectUrl } =
    clerkPublicAuthConfig;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A2540] p-6">
      <div className="w-full max-w-md">
        <SignUp
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
          path={signUpPath}
          routing="path"
          signInUrl={signInUrl}
          afterSignUpUrl={signUpFallbackRedirectUrl}
        />
      </div>
    </div>
  );
}
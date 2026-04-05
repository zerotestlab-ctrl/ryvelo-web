import { SignIn } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

import { clerkPublicAuthConfig } from "@/lib/clerk-public-config";

export default function SignInPage() {
  const { signInPath, signUpUrl, signInFallbackRedirectUrl } =
    clerkPublicAuthConfig;

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
          path={signInPath}
          routing="path"
          signUpUrl={signUpUrl}
          afterSignInUrl={signInFallbackRedirectUrl}
        />
      </div>
    </div>
  );
}
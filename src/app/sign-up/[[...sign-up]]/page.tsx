import { SignUp } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

export default function SignUpPage() {
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
          path="/sign-up"
          routing="path"
          signInUrl="/sign-in"
          afterSignUpUrl="/dashboard"
        />
      </div>
    </div>
  );
}
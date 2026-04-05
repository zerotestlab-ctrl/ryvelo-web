import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";

import { ThemeProvider } from "@/components/theme-provider";
import { assertClerkPublishableKeyForProduction } from "@/lib/clerk-env";
import { clerkPublicAuthConfig } from "@/lib/clerk-public-config";

assertClerkPublishableKeyForProduction();

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ryvelo",
  description: "Fintech ops dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ClerkProvider
          signInUrl={clerkPublicAuthConfig.signInUrl}
          signUpUrl={clerkPublicAuthConfig.signUpUrl}
          signInFallbackRedirectUrl={
            clerkPublicAuthConfig.signInFallbackRedirectUrl
          }
          signUpFallbackRedirectUrl={
            clerkPublicAuthConfig.signUpFallbackRedirectUrl
          }
          afterSignInUrl={clerkPublicAuthConfig.signInFallbackRedirectUrl}
          afterSignUpUrl={clerkPublicAuthConfig.signUpFallbackRedirectUrl}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            {children}
            <Toaster richColors position="top-center" closeButton />
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}

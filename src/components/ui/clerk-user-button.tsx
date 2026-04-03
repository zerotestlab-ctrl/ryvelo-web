"use client";

import { UserButton } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

export default function ClerkUserButton() {
  return (
    <UserButton
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#00D4C8",
          colorBackground: "#0A2540",
          colorText: "#FFFFFF",
        },
        elements: {
          avatarBox: "h-8 w-8 rounded-md ring-1 ring-white/10",
        },
      }}
    />
  );
}

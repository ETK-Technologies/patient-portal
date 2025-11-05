"use client";

import { UserProvider } from "@/contexts/UserContext";

export default function UserProviderWrapper({ children }) {
  return <UserProvider>{children}</UserProvider>;
}

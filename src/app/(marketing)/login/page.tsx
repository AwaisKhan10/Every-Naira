import type { Metadata } from "next";
import { AuthScreen } from "@/features/marketing";

export const metadata: Metadata = { title: "Log in · Every Naira Has a Job" };

export default function Page() {
  return <AuthScreen mode="login" />;
}

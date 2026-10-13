import type { Metadata } from "next";
import { AdminScreen } from "@/features/system-screens";

export const metadata: Metadata = { title: "Admin · Every Naira Has a Job" };

export default function Page() {
  return <AdminScreen />;
}

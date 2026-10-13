import type { Metadata } from "next";
import { IntegrationsScreen } from "@/features/system-screens";

export const metadata: Metadata = { title: "Integrations · Every Naira Has a Job" };

export default function Page() {
  return <IntegrationsScreen />;
}

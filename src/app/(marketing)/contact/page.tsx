import type { Metadata } from "next";
import { ContactScreen } from "@/features/marketing";

export const metadata: Metadata = { title: "Contact · Every Naira Has a Job" };

export default function Page() {
  return <ContactScreen />;
}

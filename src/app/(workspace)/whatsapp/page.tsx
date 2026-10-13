import type { Metadata } from "next";
import { CommsScreen } from "@/features/comms-screen";

export const metadata: Metadata = { title: "WhatsApp · Every Naira Has a Job" };

export default function Page() {
  return <CommsScreen channel="whatsapp" />;
}

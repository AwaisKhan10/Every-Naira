import type { Metadata } from "next";
import { SimplePage } from "@/features/marketing";

export const metadata: Metadata = { title: "Privacy · Every Naira Has a Job" };

export default function Page() {
  return (
    <SimplePage title="Privacy" lede="Demonstration copy, not a legal policy and not legal advice.">
      <p>This demo stores what you type in local browser storage on this device. It does not send those records to a server.</p>
      <p>Do not enter real customer data, passwords you use elsewhere, or card numbers. There is nowhere safe for them in this demo.</p>
    </SimplePage>
  );
}

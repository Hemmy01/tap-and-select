import type { Metadata } from "next";
import { JoinApp } from "@/components/join/JoinApp";

export const metadata: Metadata = {
  title: "Join the line · Tap&Select",
  description: "Join the Tap&Select demo line from your phone: pick a stop, get a ticket. No sign-in.",
};

export default function JoinPage() {
  return <JoinApp />;
}

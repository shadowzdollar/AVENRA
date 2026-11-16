import type { Metadata } from "next";
import { Landing } from "@/components/landing";

export const metadata: Metadata = {
  title: { absolute: "Avenra · From Intent to Completed Work" },
  description:
    "Avenra finds, collects and verifies the information client work depends on, then carries it to a verified result, with people in control.",
};

export default function HomePage() {
  return <Landing />;
}

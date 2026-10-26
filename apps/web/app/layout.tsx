import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "RepairLoop — repair the right thing, with the right part",
  description:
    "RepairLoop turns a laptop battery report or label into a source-verified replacement-part decision, then completes the purchase with PayPal."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

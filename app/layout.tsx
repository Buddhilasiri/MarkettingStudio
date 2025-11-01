import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BIoT Marketing Studio",
  description:
    "BIoT Marketing Studio centralizes marketing automation workflows for the BIoT team."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-brand-neutral text-brand-text">
      <body className="min-h-screen bg-brand-neutral font-sans antialiased">
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rafd",
  description: "In-kind donations operational platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}

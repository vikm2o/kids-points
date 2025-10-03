import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kids Points Dashboard",
  description: "Weekly routine and points tracking system for kids",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen">
        {children}
      </body>
    </html>
  );
}
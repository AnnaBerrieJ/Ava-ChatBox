import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ava — Bahamian Culture Guide",
  description: "Chat with Ava, your personal guide to Bahamian culture, history, and island life.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}

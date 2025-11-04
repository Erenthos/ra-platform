import "../globals.css";

export const metadata = {
  title: "Reverse Auction Platform",
  description: "Real-time reverse auction system for buyers and suppliers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}

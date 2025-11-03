import './globals.css';
import React from 'react';
import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'Reverse Auction Platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        <Navbar />
        <main className="p-6 container mx-auto">{children}</main>
      </body>
    </html>
  );
}

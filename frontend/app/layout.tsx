import React from "react"
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Email Scheduler',
  description: 'Schedule and manage emails at scale',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}

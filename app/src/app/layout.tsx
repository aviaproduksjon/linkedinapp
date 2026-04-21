import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Deniz LinkedIn Hub',
  description: 'LinkedIn post planning, generation, publishing and evaluation for Avia Produksjon AS',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nb">
      <body className="min-h-screen bg-white text-slate-900 antialiased">{children}</body>
    </html>
  );
}

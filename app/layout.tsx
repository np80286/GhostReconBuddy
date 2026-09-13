import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Ghost Recon Buddy | Wildlands database',
  icons: { icon: '/favicon.svg' },
  description:
    'Explore Wildlands weapons, attachment evidence, historical performance measurements, and missions.',
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}

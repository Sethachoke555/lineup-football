import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Touchline Studio — Football Lineup Graphics', description: 'Create original football starting eleven graphics and export for matchday.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}

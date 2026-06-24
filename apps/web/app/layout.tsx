import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Music Community',
  description: '사람이 추천하는 음악 커뮤니티',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}

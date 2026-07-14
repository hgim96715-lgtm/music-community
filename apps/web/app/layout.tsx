import type { Metadata } from 'next';
import './globals.css';
import AppHeader from '@/components/layout/AppHeader';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { FriendRequestPromptHost } from '@/components/friends/FriendRequestPromptHost';

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
      <body className="min-h-screen antialiased">
        <AuthProvider>
          <AppHeader />
          {children}
          <FriendRequestPromptHost />
        </AuthProvider>
      </body>
    </html>
  );
}

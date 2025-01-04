import { Inter } from "next/font/google";
import "./globals.css";
import { ClientLayout } from "@/components/layout/client-layout";
import { Metadata } from "next";
import { ErrorBoundary } from "react-error-boundary";
import { ErrorFallback } from "@/components/error-fallback";
import { Toaster } from 'sonner';
import { ChatProvider } from "@/lib/chat-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Agent Binod',
  description: 'AI-powered legal assistant',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <ChatProvider>
            <ClientLayout>
              {children}
            </ClientLayout>
          </ChatProvider>
        </ErrorBoundary>
        <Toaster />
      </body>
    </html>
  );
}

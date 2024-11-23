import { Assistant } from "@/components/assistant";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Assistant>{children}</Assistant>;
} 
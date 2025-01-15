import { SidebarLayout } from "@/components/layouts/sidebar-layout";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SidebarLayout>{children}</SidebarLayout>;
} 
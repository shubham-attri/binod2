import { SidebarLayout } from "@/components/layouts/sidebar-layout";

export default function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SidebarLayout>{children}</SidebarLayout>;
} 
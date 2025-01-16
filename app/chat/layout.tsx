import { Sidebar, SidebarBody } from "@/components/ui/sidebar";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <Sidebar>
        <SidebarBody />
      </Sidebar>
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
} 
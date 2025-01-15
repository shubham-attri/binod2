"use client";

import { Plus, History } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarBody,
  SidebarLink
} from "@/components/ui/sidebar";

const links = [
  {
    label: "New chat",
    href: "/",
    icon: <Plus className="h-5 w-5 shrink-0" />
  },
  {
    label: "History",
    href: "/history",
    icon: <History className="h-5 w-5 shrink-0" />
  }
];

export function AppSidebar() {
  const pathname = usePathname();

  if (pathname === "/") return null;

  return (
    <Sidebar>
      <SidebarBody className="bg-sidebar">
        <div className="flex flex-col gap-2 p-2 font-sans">
          {links.map((link) => (
            <SidebarLink
              key={link.href}
              link={link}
              className="hover:bg-sidebar-accent rounded-lg p-3 text-sm font-medium"
            />
          ))}
        </div>
      </SidebarBody>
    </Sidebar>
  );
} 
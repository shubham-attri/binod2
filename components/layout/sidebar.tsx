"use client";

import { cn } from "@/lib/utils/utils";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  MessageSquare, 
  Search, 
  Library, 
  Vault,
  History,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarLink {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const links: SidebarLink[] = [
  {
    label: "Chat",
    href: "/chat",
    icon: <MessageSquare className="h-4 w-4 text-primary" />,
  },
  {
    label: "Discover",
    href: "/discover",
    icon: <Search className="h-4 w-4 text-primary" />,
  },
  {
    label: "Vault",
    href: "/vault",
    icon: <Vault className="h-4 w-4 text-primary" />,
  },
  {
    label: "Library",
    href: "/library",
    icon: <Library className="h-4 w-4 text-primary" />,
  },
  {
    label: "History",
    href: "/history",
    icon: <History className="h-4 w-4 text-primary" />,
  },
];

export function Sidebar({ children }: { children?: React.ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();

  return (
    <motion.div
      className="flex flex-col h-full bg-background text-foreground border-r border-border font-sans"
      animate={{ width: isExpanded ? 240 : 60 }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      transition={{ duration: 0.2 }}
    >
      {/* Logo Section - Now clickable */}
      <div 
        className="p-4 flex items-center gap-2 cursor-pointer hover:opacity-80"
        onClick={() => router.push('/')}
      >
        <div className="w-6 h-6 bg-foreground rounded-full flex items-center justify-center text-background text-sm font-bold shrink-0">
          B
        </div>
        <motion.span
          initial={false}
          animate={{ 
            opacity: isExpanded ? 1 : 0,
            width: isExpanded ? 'auto' : 0
          }}
          className="font-semibold text-lg overflow-hidden whitespace-nowrap"
        >
          Agent Binod
        </motion.span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-2 px-2 py-2 rounded-md",
              "hover:bg-muted transition-colors",
              "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="shrink-0">{link.icon}</span>
            <motion.span
              initial={false}
              animate={{ 
                opacity: isExpanded ? 1 : 0,
                width: isExpanded ? 'auto' : 0
              }}
              className="overflow-hidden whitespace-nowrap"
            >
              {link.label}
            </motion.span>
          </Link>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="p-3 mt-auto border-t">
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
        >
          <Settings className="h-4 w-4" />
          <motion.span
            animate={{ opacity: isExpanded ? 1 : 0 }}
            className="whitespace-nowrap"
          >
            Settings
          </motion.span>
        </Button>
      </div>
    </motion.div>
  );
}

// Export these for compatibility with existing code
export const SidebarBody = () => null;
export const SidebarProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;

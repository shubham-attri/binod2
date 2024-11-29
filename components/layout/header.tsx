"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Menu, ChevronRight, Plus, Clock, History } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DocumentPanel } from "../case/document-panel";
import { cn } from "@/lib/utils";
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { DocumentVersion } from "@/types/artifacts";

interface HeaderProps {
  className?: string;
  mode: "research" | "case";
  title: string;
  onTitleChange?: (title: string) => void;
  onSidebarToggle: () => void;
  documentVersions?: DocumentVersion[];
  onVersionSelect?: (version: DocumentVersion) => void;
}

export function Header({ 
  className, 
  mode, 
  title, 
  onTitleChange,
  onSidebarToggle,
  documentVersions,
  onVersionSelect
}: HeaderProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);
  const pathname = usePathname();
  const router = useRouter();
  const showBreadcrumbs = pathname.startsWith("/research") || pathname.startsWith("/cases");

  // Extract case ID from pathname if in case mode
  const caseId = mode === "case" && pathname.startsWith("/cases/") 
    ? pathname.split("/")[2] 
    : undefined;

  const handleTitleSave = () => {
    if (onTitleChange && tempTitle.trim()) {
      onTitleChange(tempTitle);
    }
    setIsEditingTitle(false);
  };

  const handleNewResearch = () => {
    router.push("/research");
  };

  const handleNewCase = () => {
    router.push("/cases");
  };

  return (
    <header className={cn(
      "sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      className
    )}>
      <div className="flex h-14 items-center px-6">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={onSidebarToggle}
          className="mr-4"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        {showBreadcrumbs ? (
          <div className="flex-1 flex items-center">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <Link 
                    href={`/${mode}`}
                    className="text-sm font-medium text-muted-foreground hover:text-foreground"
                  >
                    {mode === "research" ? "Research" : "Cases"}
                  </Link>
                </BreadcrumbItem>
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  {isEditingTitle ? (
                    <div className="flex items-center">
                      <Input
                        className="h-7 w-[200px]"
                        value={tempTitle}
                        onChange={(e) => setTempTitle(e.target.value)}
                        onBlur={handleTitleSave}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleTitleSave();
                          } else if (e.key === "Escape") {
                            setTempTitle(title);
                            setIsEditingTitle(false);
                          }
                        }}
                        placeholder="Enter title..."
                        autoFocus
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            className="h-auto p-0 font-normal hover:bg-transparent"
                          >
                            <span className="text-sm font-medium">
                              {title}
                            </span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem onClick={() => setIsEditingTitle(true)}>
                            Rename
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      {documentVersions && documentVersions.length > 0 && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-7 gap-1"
                            >
                              <History className="h-4 w-4" />
                              <span className="text-xs">
                                {documentVersions.length} versions
                              </span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-[300px]">
                            {documentVersions.map((version, index) => (
                              <DropdownMenuItem
                                key={version.id}
                                onClick={() => onVersionSelect?.(version)}
                                className="flex items-center justify-between"
                              >
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  <div className="flex flex-col">
                                    <span className="text-sm">
                                      Version {documentVersions.length - index}
                                    </span>
                                    {version.comment && (
                                      <span className="text-xs text-muted-foreground">
                                        {version.comment}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(version.createdAt).toLocaleString()}
                                </span>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  )}
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="ml-auto flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={mode === "research" ? handleNewResearch : handleNewCase}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                New {mode === "research" ? "Research" : "Case"}
              </Button>

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Documents
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[600px] sm:w-[800px] p-0">
                  <DocumentPanel caseId={caseId || ""} />
                </SheetContent>
              </Sheet>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-between">
            <h1 className="text-lg font-semibold">
              {mode === "research" ? "Research History" : "Case History"}
            </h1>
            <Button 
              variant="default" 
              size="sm" 
              onClick={mode === "research" ? handleNewResearch : handleNewCase}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              New {mode === "research" ? "Research" : "Case"}
            </Button>
          </div>
        )}
      </div>
    </header>
  );
} 
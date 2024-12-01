"use client";

import React, { useState } from "react";
import { ResearchMode } from "./research/research-mode";
import { CaseMode } from "./cases/case-mode";
import { PlaygroundMode } from "./playground/playground-mode";
import { Button } from "./ui/button";

type Mode = "research" | "case" | "playground";

export interface AssistantProps {}

export function Assistant({}: AssistantProps) {
  const [mode, setMode] = useState<Mode>("research");

  return (
    <div className="flex h-screen w-full flex-col">
      <nav className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center space-x-4">
          <Button
            variant={mode === "research" ? "default" : "ghost"}
            onClick={() => setMode("research")}
          >
            Research
          </Button>
          <Button
            variant={mode === "case" ? "default" : "ghost"}
            onClick={() => setMode("case")}
          >
            Case
          </Button>
          <Button
            variant={mode === "playground" ? "default" : "ghost"}
            onClick={() => setMode("playground")}
          >
            Playground
          </Button>
        </div>
      </nav>

      <main className="flex-1 overflow-hidden">
        {mode === "research" && <ResearchMode />}
        {mode === "case" && <CaseMode />}
        {mode === "playground" && <PlaygroundMode />}
      </main>
    </div>
  );
} 
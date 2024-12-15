"use client";

import React from "react";
import { ResearchLayout } from "./research-layout";

export interface ResearchModeProps {}

export function ResearchMode({}: ResearchModeProps) {
  return (
    <div className="flex h-screen">
      <div className="flex-1 flex flex-col p-4">
        <ResearchLayout className="h-full w-full" />
      </div>
    </div>
  );
} 
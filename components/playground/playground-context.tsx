import React, { createContext, useContext, useState } from "react";

interface PlaygroundSettings {
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  streamResponse: boolean;
  includeCitations: boolean;
  useMemory: boolean;
}

interface PlaygroundContextType {
  settings: PlaygroundSettings;
  updateSettings: (settings: Partial<PlaygroundSettings>) => void;
  history: {
    id: string;
    title: string;
    date: Date;
  }[];
  addToHistory: (chat: { title: string }) => void;
  clearHistory: () => void;
}

const defaultSettings: PlaygroundSettings = {
  model: "claude-3-opus",
  temperature: 0.7,
  maxTokens: 4000,
  systemPrompt: "You are a helpful legal assistant...",
  streamResponse: true,
  includeCitations: true,
  useMemory: true,
};

const PlaygroundContext = createContext<PlaygroundContextType | undefined>(undefined);

export function PlaygroundProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<PlaygroundSettings>(defaultSettings);
  const [history, setHistory] = useState<PlaygroundContextType["history"]>([]);

  const updateSettings = (newSettings: Partial<PlaygroundSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const addToHistory = (chat: { title: string }) => {
    const newChat = {
      id: Math.random().toString(36).substring(7),
      title: chat.title,
      date: new Date(),
    };
    setHistory((prev) => [newChat, ...prev]);
  };

  const clearHistory = () => {
    setHistory([]);
  };

  return (
    <PlaygroundContext.Provider
      value={{
        settings,
        updateSettings,
        history,
        addToHistory,
        clearHistory,
      }}
    >
      {children}
    </PlaygroundContext.Provider>
  );
}

export function usePlayground() {
  const context = useContext(PlaygroundContext);
  if (context === undefined) {
    throw new Error("usePlayground must be used within a PlaygroundProvider");
  }
  return context;
} 
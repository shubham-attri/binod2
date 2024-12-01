"use client";

import React from "react";
import { Card } from "../ui/card";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Slider } from "../ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";

export interface Settings {
  temperature: number;
  maxTokens: number;
  stream: boolean;
  useContext: boolean;
  useHistory: boolean;
  model: string;
  systemPrompt: string;
}

interface PlaygroundSettingsProps {
  settings: Settings;
  onSettingChange: (key: keyof Settings, value: any) => void;
}

export function PlaygroundSettings({
  settings,
  onSettingChange,
}: PlaygroundSettingsProps) {
  return (
    <div className="space-y-4 p-4">
      <Card className="p-4">
        <h3 className="font-medium mb-4">Model Settings</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Model</Label>
            <Select
              value={settings.model}
              onValueChange={(value) => onSettingChange("model", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4">GPT-4</SelectItem>
                <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                <SelectItem value="claude-3">Claude 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Temperature ({settings.temperature})</Label>
            <Slider
              value={[settings.temperature]}
              min={0}
              max={2}
              step={0.1}
              onValueChange={([value]) =>
                onSettingChange("temperature", value)
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Max Tokens ({settings.maxTokens})</Label>
            <Slider
              value={[settings.maxTokens]}
              min={100}
              max={4000}
              step={100}
              onValueChange={([value]) => onSettingChange("maxTokens", value)}
            />
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-medium mb-4">System Prompt</h3>
        <Textarea
          value={settings.systemPrompt}
          onChange={(e) => onSettingChange("systemPrompt", e.target.value)}
          placeholder="Enter system prompt..."
          rows={4}
          className="resize-none"
        />
      </Card>

      <Card className="p-4">
        <h3 className="font-medium mb-4">Response Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="stream">Stream Response</Label>
            <Switch
              id="stream"
              checked={settings.stream}
              onCheckedChange={(checked) =>
                onSettingChange("stream", checked)
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="context">Use Context</Label>
            <Switch
              id="context"
              checked={settings.useContext}
              onCheckedChange={(checked) =>
                onSettingChange("useContext", checked)
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="history">Use Chat History</Label>
            <Switch
              id="history"
              checked={settings.useHistory}
              onCheckedChange={(checked) =>
                onSettingChange("useHistory", checked)
              }
            />
          </div>
        </div>
      </Card>
    </div>
  );
} 
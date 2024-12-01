"use client";

import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SettingsPage() {
  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">Settings</h1>
      
      <div className="space-y-6">
        <Card className="p-4">
          <h2 className="text-lg font-medium mb-4">Appearance</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode">Dark Mode</Label>
              <Switch id="dark-mode" />
            </div>
            <div className="space-y-2">
              <Label>Theme</Label>
              <Select defaultValue="system">
                <SelectTrigger>
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="text-lg font-medium mb-4">AI Model</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Default Model</Label>
              <Select defaultValue="gpt-4">
                <SelectTrigger>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="gpt-3.5">GPT-3.5</SelectItem>
                  <SelectItem value="claude">Claude</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="streaming">Response Streaming</Label>
              <Switch id="streaming" defaultChecked />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="text-lg font-medium mb-4">Privacy</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="history">Save Chat History</Label>
              <Switch id="history" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="analytics">Usage Analytics</Label>
              <Switch id="analytics" defaultChecked />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
} 
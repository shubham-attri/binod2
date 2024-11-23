"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCase } from "./case-context";

const caseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  clientName: z.string().min(1, "Client name is required"),
  status: z.enum(["active", "pending", "closed"]),
  description: z.string().optional(),
});

type CaseFormData = z.infer<typeof caseSchema>;

export function CreateCaseDialog() {
  const [open, setOpen] = useState(false);
  const { createCase } = useCase();
  
  const form = useForm<CaseFormData>({
    resolver: zodResolver(caseSchema),
    defaultValues: {
      status: "active",
    },
  });

  const onSubmit = async (data: CaseFormData) => {
    createCase(data);
    setOpen(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">New Case</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Case</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Input
              placeholder="Case Title"
              {...form.register("title")}
            />
            {form.formState.errors.title && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>
          
          <div>
            <Input
              placeholder="Client Name"
              {...form.register("clientName")}
            />
            {form.formState.errors.clientName && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.clientName.message}
              </p>
            )}
          </div>

          <div>
            <Select
              onValueChange={(value) => form.setValue("status", value as any)}
              defaultValue={form.getValues("status")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <textarea
              className="w-full p-2 border rounded-md"
              placeholder="Case Description (optional)"
              {...form.register("description")}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Case</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 
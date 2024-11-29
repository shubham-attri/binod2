"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { caseService } from "@/lib/case-service";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";

const createCaseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  clientName: z.string().min(1, "Client name is required"),
  description: z.string().optional(),
  status: z.enum(["active", "pending", "closed"]).default("active"),
  priority: z.enum(["high", "medium", "low"]).default("medium"),
});

type CreateCaseForm = z.infer<typeof createCaseSchema>;

const isDevelopment = process.env.NODE_ENV === 'development';

export function CreateCaseDialog({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<CreateCaseForm>({
    resolver: zodResolver(createCaseSchema),
    defaultValues: {
      status: "active",
      priority: "medium",
    },
  });

  // Check auth status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Auth error:', error);
      }
      console.log('Current session:', session);

      // Validate Supabase connection
      const { error: healthCheck } = await supabase.from('cases').select('count').limit(1);
      if (healthCheck) {
        console.error('Supabase connection error:', healthCheck);
      } else {
        console.log('Supabase connection successful');
      }
    };

    checkAuth();
  }, []);

  const onSubmit = async (data: CreateCaseForm) => {
    try {
      setIsLoading(true);
      console.log('Form data:', data);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('User error:', userError);
        toast.error("Authentication error. Please check your configuration.");
        return;
      }

      let userId = user?.id;

      // Handle development mode
      if (isDevelopment) {
        userId = process.env.NEXT_PUBLIC_DEV_USER_ID;
        console.log('Using development user ID:', userId);
      } else if (!user) {
        toast.error("Please sign in to create a case");
        return;
      }

      if (!userId) {
        toast.error("User ID not available");
        return;
      }

      console.log('Creating case with user:', userId);
      const newCase = await caseService.createCase({
        ...data,
        userId,
        tags: []
      });

      toast.success("Case created successfully");
      setOpen(false);
      form.reset();
      router.push(`/cases/${newCase.id}`);
    } catch (err) {
      console.error('Create case error:', err);
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Failed to create case. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Case
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Create New Case</DialogTitle>
            <DialogDescription>
              Add a new case to your workspace
              {isDevelopment && (
                <span className="text-yellow-500 block mt-1">
                  Running in development mode
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Case Title</Label>
              <Input
                id="title"
                {...form.register("title")}
                placeholder="Enter case title"
              />
              {form.formState.errors.title && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name</Label>
              <Input
                id="clientName"
                {...form.register("clientName")}
                placeholder="Enter client name"
              />
              {form.formState.errors.clientName && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.clientName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...form.register("description")}
                placeholder="Enter case description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  onValueChange={(value: "active" | "pending" | "closed") =>
                    form.setValue("status", value)
                  }
                  defaultValue={form.getValues("status")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  onValueChange={(value: "high" | "medium" | "low") =>
                    form.setValue("priority", value)
                  }
                  defaultValue={form.getValues("priority")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false);
                form.reset();
              }}
              type="button"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Case"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 
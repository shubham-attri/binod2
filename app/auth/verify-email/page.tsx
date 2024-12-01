"use client";

import { Card } from "@/components/ui/card";
import Link from "next/link";

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md space-y-6 p-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We've sent you a verification link to your email address.
            Please click the link to verify your account.
          </p>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <h2 className="text-sm font-medium">What happens next?</h2>
            <ul className="mt-2 list-inside list-disc text-sm text-muted-foreground">
              <li>Check your email inbox</li>
              <li>Click the verification link in the email</li>
              <li>Once verified, you can sign in to your account</li>
            </ul>
          </div>

          <div className="text-center text-sm">
            <p className="text-muted-foreground">
              Didn't receive the email?{" "}
              <Link href="/auth/signup" className="text-primary hover:underline">
                Try signing up again
              </Link>
            </p>
          </div>

          <div className="text-center text-sm">
            <Link href="/auth/login" className="text-primary hover:underline">
              Return to login
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
} 
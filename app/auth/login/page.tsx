"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const field = "h-11 rounded-full border-white/70 bg-white/80 px-4 dark:border-white/10 dark:bg-white/5";

export default function LoginPage() {
  const [error, action, pending] = useActionState(login, undefined);

  return (
    <main className="flex min-h-full flex-1 items-center justify-center p-6">
      <div className="panel flex w-full max-w-md flex-col gap-8 p-10">
        <div className="flex flex-col gap-4">
          <span
            aria-hidden
            className="grid size-12 place-items-center rounded-full bg-navy text-base font-semibold tracking-tight text-navy-foreground"
          >
            Tx
          </span>
          <div>
            <h1 className="text-3xl font-light tracking-tight">Sign in</h1>
            <p className="mt-1 text-sm text-muted-foreground">to TXP Pro</p>
          </div>
        </div>

        <form action={action} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@practice.com"
              required
              className={field}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className={field}
            />
          </div>
          {error && (
            <p role="alert" className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-[color-mix(in_oklch,var(--destructive)_75%,var(--foreground))]">
              {error}
            </p>
          )}
          <Button
            type="submit"
            disabled={pending}
            className="mt-1 h-11 w-full rounded-full bg-navy text-sm text-navy-foreground hover:bg-navy/90"
          >
            {pending ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>
    </main>
  );
}

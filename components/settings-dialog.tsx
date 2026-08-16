"use client";

import { useState } from "react";
import Link from "next/link";
import { Settings } from "lucide-react";
import { updatePracticeName } from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function SettingsDialog({ initialPracticeName }: { initialPracticeName: string }) {
  const [open, setOpen] = useState(false);

  async function action(formData: FormData) {
    const name = formData.get("name");
    await updatePracticeName(typeof name === "string" ? name : "");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Settings"
          title="Settings"
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Settings className="size-4" />
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Practice name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={initialPracticeName}
              placeholder="Papastergiou Dental"
            />
            <p className="text-xs text-muted-foreground">
              Shown in the sticky header. Leave blank to just show &quot;TXP Pro&quot;.
            </p>
          </div>
          <Button type="submit">Save</Button>
        </form>
        <Link
          href="/procedures"
          onClick={() => setOpen(false)}
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Manage procedure codes →
        </Link>
      </DialogContent>
    </Dialog>
  );
}

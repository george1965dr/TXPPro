"use client";

import { useState } from "react";
import Link from "next/link";
import { Settings } from "lucide-react";
import { updatePracticeSettings } from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface SettingsDialogProps {
  initialPracticeName: string;
  initialPracticeAddress: string;
}

export function SettingsDialog({ initialPracticeName, initialPracticeAddress }: SettingsDialogProps) {
  const [open, setOpen] = useState(false);

  async function action(formData: FormData) {
    const name = formData.get("name");
    const address = formData.get("address");
    await updatePracticeSettings(
      typeof name === "string" ? name : "",
      typeof address === "string" ? address : "",
    );
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
          <div className="flex flex-col gap-2">
            <Label htmlFor="address">Practice address</Label>
            <Textarea
              id="address"
              name="address"
              defaultValue={initialPracticeAddress}
              placeholder={"123 Main St, Suite 100\nAnytown, ST 12345"}
              rows={2}
            />
            <p className="text-xs text-muted-foreground">
              Printed on the treatment plan letterhead.
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

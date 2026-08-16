"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { createPatient } from "@/app/actions/patients";
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

export function NewPatientDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          New patient
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New patient</DialogTitle>
        </DialogHeader>
        <form action={createPatient} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="birth_date">Birth date</Label>
            <Input id="birth_date" name="birth_date" type="date" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email (optional)</Label>
            <Input id="email" name="email" type="email" />
          </div>
          <Button type="submit" className="mt-2">
            Create patient
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

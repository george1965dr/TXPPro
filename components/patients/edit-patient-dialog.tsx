"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { updatePatient } from "@/app/actions/patients";
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
import type { Patient } from "@/lib/types";

export function EditPatientDialog({ patient }: { patient: Patient }) {
  const [open, setOpen] = useState(false);
  const updatePatientWithId = updatePatient.bind(null, patient.id);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="size-4" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit patient</DialogTitle>
        </DialogHeader>
        <form
          action={async (formData) => {
            await updatePatientWithId(formData);
            setOpen(false);
          }}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-name">Name</Label>
            <Input id="edit-name" name="name" defaultValue={patient.name} required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-birth_date">Birth date</Label>
            <Input
              id="edit-birth_date"
              name="birth_date"
              type="date"
              defaultValue={patient.birth_date}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-email">Email (optional)</Label>
            <Input id="edit-email" name="email" type="email" defaultValue={patient.email ?? ""} />
          </div>
          <Button type="submit" className="mt-2">
            Save changes
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

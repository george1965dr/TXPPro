"use client";

import { useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { createProcedure, updateProcedure } from "@/app/actions/procedures";
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
import type { Procedure } from "@/lib/types";

interface ProcedureDialogProps {
  procedure?: Procedure;
  trigger?: ReactNode;
}

export function ProcedureDialog({ procedure, trigger }: ProcedureDialogProps) {
  const [open, setOpen] = useState(false);
  const isEdit = !!procedure;

  const action = isEdit
    ? async (formData: FormData) => {
        await updateProcedure(procedure.id, formData);
        setOpen(false);
      }
    : async (formData: FormData) => {
        await createProcedure(formData);
        setOpen(false);
      };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="size-4" />
            New procedure
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit ${procedure.ada_code}` : "New procedure"}</DialogTitle>
        </DialogHeader>
        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="ada_code">ADA code</Label>
            <Input
              id="ada_code"
              name="ada_code"
              defaultValue={procedure?.ada_code}
              placeholder="D2391"
              required
            />
            {isEdit && (
              <p className="text-xs text-muted-foreground">
                Some codes are looked up by the odontogram&apos;s auto-pricing (e.g. filling and
                root canal codes). Changing this code means charted items that reference it stop
                finding a fee until you update it here too.
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              defaultValue={procedure?.description}
              placeholder="Resin-based composite, one surface, posterior"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="fee">Fee ($)</Label>
            <Input
              id="fee"
              name="fee"
              type="number"
              min={0}
              step="0.01"
              defaultValue={procedure?.fee}
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="tooth_required"
              name="tooth_required"
              type="checkbox"
              defaultChecked={procedure?.tooth_required ?? true}
              className="size-4"
            />
            <Label htmlFor="tooth_required" className="font-normal">
              Requires a tooth number
            </Label>
          </div>
          <Button type="submit" className="mt-2">
            {isEdit ? "Save changes" : "Create procedure"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

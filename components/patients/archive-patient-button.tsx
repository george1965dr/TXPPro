"use client";

import { Trash2 } from "lucide-react";
import { archivePatient } from "@/app/actions/patients";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function ArchivePatientButton({ patientId, patientName }: { patientId: string; patientName: string }) {
  const archivePatientWithId = archivePatient.bind(null, patientId);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="size-4" />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {patientName}?</AlertDialogTitle>
          <AlertDialogDescription>
            This archives the patient and all their records — nothing is permanently deleted, and it
            can be restored later.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <form action={archivePatientWithId}>
            <AlertDialogAction type="submit" variant="destructive" className="w-full">
              Delete
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

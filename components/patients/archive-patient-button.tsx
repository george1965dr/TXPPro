"use client";

import { Archive } from "lucide-react";
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
        <Button variant="outline" className="h-9 rounded-full px-4">
          <Archive className="size-4" />
          Archive
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive {patientName}?</AlertDialogTitle>
          <AlertDialogDescription>
            They move to the Archived list with all their records. Nothing is deleted, and you can
            restore them at any time.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <form action={archivePatientWithId}>
            <AlertDialogAction type="submit" className="w-full">
              Archive
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";

interface RenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentName: string;
  onRename: (newName: string) => void;
}

export const RenameDialog = ({
  open,
  onOpenChange,
  currentName,
  onRename,
}: RenameDialogProps) => {
  const [name, setName] = useState(currentName);

  // Update local state when currentName prop changes
  useEffect(() => {
    setName(currentName);
  }, [currentName]);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Rename File</AlertDialogTitle>
          <AlertDialogDescription>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter new name"
              className="mt-2"
              autoFocus
            />
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              if (name.trim()) {
                onRename(name.trim());
              }
            }}
          >
            Rename
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}; 
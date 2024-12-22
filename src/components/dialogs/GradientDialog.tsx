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
import { gradientThemes } from "@/lib/gradients";

interface GradientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  name: string;
  onNameChange: (name: string) => void;
  gradientId?: number;
  onGradientChange: (gradientId: number) => void;
  onConfirm: () => void;
  confirmText?: string;
}

export function GradientDialog({
  open,
  onOpenChange,
  title,
  name,
  onNameChange,
  gradientId,
  onGradientChange,
  onConfirm,
  confirmText = "Save",
}: GradientDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            <div className="space-y-4">
              <Input
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="Enter chat name"
                className="mt-2"
                autoFocus
              />
              <div>
                <label className="text-sm text-muted-foreground">
                  Choose Theme (optional)
                </label>
                <div className="grid grid-cols-5 gap-2 mt-2">
                  {gradientThemes.map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      className={`${
                        theme.gradient
                      } h-8 rounded-md transition-all ${
                        gradientId === theme.id
                          ? "ring-2 ring-offset-2 ring-black"
                          : ""
                      }`}
                      onClick={() => onGradientChange(theme.id)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createChatSchema, CreateChatInput } from "@/lib/validations/chat";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { gradientThemes } from "@/lib/constant/gradients";
import { useEffect } from "react";
import { Separator } from "../ui/separator";

interface GradientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  name?: string;
  onNameChange?: (name: string) => void;
  gradientId?: number;
  onGradientChange: (gradientId: number) => void;
  onConfirm: (data: CreateChatInput) => void;
  confirmText?: string;
}

export function GradientDialog({
  open,
  onOpenChange,
  title,
  gradientId,
  onGradientChange,
  onConfirm,
  confirmText = "Save",
}: GradientDialogProps) {
  const form = useForm<CreateChatInput>({
    resolver: zodResolver(createChatSchema),
    defaultValues: {
      name: "",
      gradientId: gradientId,
    },
  });

  useEffect(() => {
    form.setValue("gradientId", gradientId);
  }, [gradientId, form]);

  const onSubmit = (data: CreateChatInput) => {
    onConfirm(data);
    form.reset();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <AlertDialogHeader>
              <AlertDialogTitle>{title}</AlertDialogTitle>
              <AlertDialogDescription>
                <Separator className="mb-4" />
                <div className="space-y-4">
                  <FormLabel schema={createChatSchema} field="name">
                    Name
                  </FormLabel>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            placeholder="Enter chat name"
                            className="mt-2"
                            autoFocus
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              form.trigger("name"); // Trigger validation on change
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="pt-2">
                    <FormLabel schema={createChatSchema} field="gradientId">
                      Choose Theme (optional)
                    </FormLabel>
                    <div className="grid grid-cols-5 gap-2 mt-2">
                      {gradientThemes.map((theme) => (
                        <button
                          key={theme.id}
                          type="button"
                          className={`${
                            theme.gradient
                          } h-8 rounded-md transition-all ${
                            gradientId === theme.id
                              ? "ring-2 ring-offset-2 ring-black dark:ring-white"
                              : ""
                          }`}
                          onClick={() => {
                            onGradientChange(theme.id);
                            form.setValue("gradientId", theme.id);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="pt-6 border-t">
              <AlertDialogCancel onClick={() => form.reset()}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                type="submit"
                disabled={
                  !form.formState.isValid || form.formState.isSubmitting
                }
              >
                {confirmText}
              </AlertDialogAction>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

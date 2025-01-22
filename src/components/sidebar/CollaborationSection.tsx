"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import { CollaborationStatus } from "@/types/collaboration";
import { ConfirmationDialog } from "../dialogs/ConfirmationDialog";
import {
  inviteEmailSchema,
  type InviteEmailSchema,
} from "@/lib/validations/collaboration";
import { useState } from "react";

interface CollaborationSectionProps {
  chatId: string;
}

export function CollaborationSection({ chatId }: CollaborationSectionProps) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    trigger,
  } = useForm<InviteEmailSchema>({
    resolver: zodResolver(inviteEmailSchema),
    defaultValues: {
      email: "",
    },
  });

  // Query to get current collaboration status and users
  const { data: collaborationData, isLoading } = useQuery({
    queryKey: ["collaboration", chatId],
    queryFn: async () => {
      const response = await axios.get(`/api/collaborate/${chatId}`);
      return response.data as CollaborationStatus;
    },
  });

  const isOwner = collaborationData?.isOwner;

  // Mutation to toggle collaboration
  const toggleCollaborationMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post(`/api/collaborate/toggle`, {
        chatId,
      });
      return response.data;
    },
    onMutate: async () => {
      const previousData = queryClient.getQueryData(["collaboration", chatId]);
      queryClient.setQueryData(["collaboration", chatId], (old: any) => ({
        ...old,
        isCollaborative: !old?.isCollaborative,
      }));
      return { previousData };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(
        ["collaboration", chatId],
        context?.previousData
      );
      toast.error("Failed to update collaboration status");
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["collaboration", chatId] });
      toast.success("Collaboration status updated");
    },
  });

  // Mutation to invite user
  const inviteUserMutation = useMutation({
    mutationFn: async (data: InviteEmailSchema) => {
      const response = await axios.post("/api/collaborate/invite", {
        chatId,
        email: data.email,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collaboration", chatId] });
      toast.success("Invitation sent successfully");
      reset(); // Reset form after successful invitation
    },
    onError: (error: any) => {
      toast.error(error.response?.data || "Failed to send invitation");
    },
  });

  const onSubmit = handleSubmit((data) => {
    inviteUserMutation.mutate(data);
  });

  // Mutation to remove collaborator
  const removeCollaboratorMutation = useMutation({
    mutationFn: async (userId: string) => {
      await axios.delete(`/api/collaborate/user`, {
        data: { chatId, userId },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collaboration", chatId] });
      toast.success("Collaborator removed");
    },
    onError: () => {
      toast.error("Failed to remove collaborator");
    },
  });

  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean;
    userId: string | null;
  }>({
    isOpen: false,
    userId: null,
  });

  const handleRemoveCollaborator = (userId: string) => {
    setDialogConfig({
      isOpen: true,
      userId,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="w-full space-y-4 border-t px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <Label htmlFor="collaboration" className="text-sm font-medium">
              Collaboration
            </Label>
          </div>
          {isOwner && (
            <Switch
              id="collaboration"
              checked={collaborationData?.isCollaborative}
              onCheckedChange={() => toggleCollaborationMutation.mutate()}
              disabled={toggleCollaborationMutation.isPending}
            />
          )}
        </div>

        {isOwner && collaborationData?.isCollaborative && (
          <div className="space-y-2">
            <Label htmlFor="email">Invite by email</Label>
            <form onSubmit={onSubmit} className="space-y-2">
              <div className="flex space-x-2">
                <div className="flex-1">
                  <Input
                    id="email"
                    placeholder="colleague@example.com"
                    type="email"
                    className={errors.email ? "border-red-500" : ""}
                    {...register("email", {
                      onChange: () => trigger("email"), // Trigger validation on change
                    })}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  size="sm"
                  disabled={inviteUserMutation.isPending}
                >
                  {inviteUserMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Invite"
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}

        {collaborationData?.collaborators && (
          <div className="space-y-2">
            <Label>Collaborators</Label>
            <div className="space-y-2">
              {collaborationData.collaborators.map((user: any) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2 rounded-md border"
                >
                  <div className="flex items-center truncate space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user.imageUrl} />
                      <AvatarFallback>
                        {user.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm truncate">{user.email}</span>
                    {user.isOwner && (
                      <Badge variant="secondary" className="text-xs">
                        Owner
                      </Badge>
                    )}
                  </div>
                  {isOwner && !user.isOwner && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCollaborator(user.id)}
                      disabled={removeCollaboratorMutation.isPending}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ConfirmationDialog
        open={dialogConfig.isOpen}
        onOpenChange={(open) =>
          !open && setDialogConfig((prev) => ({ ...prev, isOpen: false }))
        }
        title="Remove Collaborator"
        description="Are you sure you want to remove this collaborator?"
        onConfirm={() => {
          if (dialogConfig.userId) {
            removeCollaboratorMutation.mutate(dialogConfig.userId);
            setDialogConfig({ isOpen: false, userId: null });
          }
        }}
        confirmText="Remove"
        confirmButtonClass="bg-red-500 hover:bg-red-600"
      />
    </>
  );
}

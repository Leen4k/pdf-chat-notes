import { gradientThemes } from "@/lib/gradients";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Palette } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";

interface GradientThemeSelectorProps {
  chatId: string;
  currentGradientId?: number;
}

export function GradientThemeSelector({
  chatId,
  currentGradientId,
}: GradientThemeSelectorProps) {
  const queryClient = useQueryClient();

  const updateGradientMutation = useMutation({
    mutationFn: async (gradientId: number) => {
      const response = await axios.patch(`/api/chat/${chatId}`, {
        gradientId,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
      toast.success("Theme updated");
    },
    onError: () => {
      toast.error("Failed to update theme");
    },
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Palette className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="grid grid-cols-5 gap-2 p-2">
          {gradientThemes.map((theme) => (
            <button
              key={theme.id}
              className={`${theme.gradient} h-8 rounded-md transition-all ${
                currentGradientId === theme.id
                  ? "ring-2 ring-offset-2 ring-black dark:ring-white p-2"
                  : ""
              }`}
              onClick={() => updateGradientMutation.mutate(theme.id)}
            />
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

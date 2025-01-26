import React, { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const GEMINI_MODELS = [
  {
    name: "Gemini 1.5 Flash",
    value: "gemini-1.5-flash",
    description: "Fast and efficient model",
  },
  {
    name: "Gemini 1.5 Pro",
    value: "gemini-1.5-pro",
    description: "More advanced, better reasoning",
  },
  {
    name: "Gemini 1.5 flash 8b",
    value: "gemini-1.5-flash-8b",
    description: "Standard model",
  },
  {
    name: "Gemini Flash 2.0",
    value: "gemini-2.0-flash-exp",
    description: "Standard model",
  },
];

export function GeminiModelSelector({
  currentModel,
  onModelChange,
}: {
  currentModel: string;
  onModelChange: (model: string) => void;
}) {
  return (
    <Select
      value={currentModel}
      onValueChange={(value) => onModelChange(value)}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select Model" />
      </SelectTrigger>
      <SelectContent>
        {GEMINI_MODELS.map((model) => (
          <SelectItem key={model.value} value={model.value}>
            {model.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

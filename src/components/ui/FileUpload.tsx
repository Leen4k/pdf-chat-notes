"use client";
import { sanitizeFileName, uploadFile } from "@/utils/supabase/supabaseUpload";
import { supabase } from "../../../supabase";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useRouter, useParams } from "next/navigation";
import { TbCloudUpload } from "react-icons/tb";
import { Button } from "./button";

interface CreateChatProps {
  file_key: string;
  file_name: string;
  file_url: string;
}

interface FileUploadProps {
  onUploadComplete: (newFile: any) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUploadComplete }) => {
  const router = useRouter();
  const { chatId } = useParams(); // Get the current chatId
  const queryClient = useQueryClient();

  const { mutate } = useMutation({
    mutationFn: async ({ file_key, file_name, file_url }: CreateChatProps) => {
      const { data } = await axios.post("/api/chat", {
        file_key,
        file_name,
        file_url,
        chatId, // Pass the chatId to the API
      });
      console.log(data);
      return data;
    },
    onMutate: () => {
      toast.loading(`embedding data to ${chatId}...`, { id: "embedding" });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["documentChats", chatId], // Update the query key to include chatId
      });
      queryClient.invalidateQueries({
        queryKey: ["userChats"],
        exact: false,
      });
      toast.success("embedded data successfully", { id: "embedding" });
    },
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    onDrop: async (acceptedFile) => {
      const file = acceptedFile[0];
      const fileName = acceptedFile[0].name;
      const originalFileName = file.name;
      const sanitizedFileName = sanitizeFileName(originalFileName);

      // Create a new File object with the sanitized name
      const sanitizedFile = new File([file], sanitizedFileName, {
        type: file.type,
      });

      if (file.size > 15 * 1024 * 1024) {
        // larger than 15mb
        toast.error("please upload a smaller file");
        return;
      }

      const toastId = toast.loading("uploading...");

      try {
        const { id, publicUrl, path } = await uploadFile(sanitizedFile, "AI_PDF bucket");
        mutate(
          {
            file_key: id,
            file_name: path.split("public/")[1],
            file_url: publicUrl,
          },
          {
            onSuccess: (data) => {
              // toast.success(data.message);
              // Optionally navigate to the chat if not already there
              if (chatId) {
                router.push(`/chats/${chatId}`);
              }
            },
            onSettled: (data) => {
              queryClient.invalidateQueries({
                queryKey: ["documentChats", chatId],
                exact: false,
              });
            },
            onError: (err) => toast.error(err.message),
          }
        );
      } catch (err: any) {
        toast.error(err.message);
      } finally {
        toast.dismiss(toastId);
      }
    },
  });

  return (
    <div
      {...getRootProps({
        className: "border-1 border-slate-500",
      })}
    >
      <input
        type="text"
        {...getInputProps()}
        placeholder="drop your file here.."
        className="placeholder:text-black"
      />
      {isDragActive ? (
        <Button className="flex w-full items-center justify-center ">
          <TbCloudUpload />
          <span className="text-sm">Drop file here...</span>
        </Button>
      ) : (
        <Button className="flex w-full items-center justify-center">
          <TbCloudUpload />
          <span className="text-sm">Upload</span>
        </Button>
      )}
    </div>
  );
};

export default FileUpload;

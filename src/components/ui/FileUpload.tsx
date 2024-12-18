"use client";
import { uploadFile } from "@/utils/supabase/supabaseUpload";
import { supabase } from "../../../supabase";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useRouter, useParams } from "next/navigation";
import { TbCloudUpload } from "react-icons/tb";

interface CreateChatProps {
  file_key: string;
  file_name: string;
  file_url: string;
}

const FileUpload = () => {
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
      toast.success("embedded data successfully", { id: "embedding" });
    },
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    onDrop: async (acceptedFile) => {
      const file = acceptedFile[0];
      const fileName = acceptedFile[0].name;
      const toastId = toast.loading("uploading...");

      if (file.size > 10 * 1024 * 1024) {
        // larger than 10mb
        toast.error("please upload a smaller file");
        return;
      }

      try {
        const { id, publicUrl, path } = await uploadFile(file, "AI_PDF bucket");
        mutate(
          {
            file_key: id,
            file_name: path.split("public/")[1],
            file_url: publicUrl,
          },
          {
            onSuccess: (data) => {
              toast.success(data.message);
              // Optionally navigate to the chat if not already there
              if (chatId) {
                router.push(`/chats/${chatId}`);
              }
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
    <div className="p-2 text-xl glassmorphism h-[180px] text-center flex items-center justify-center">
      <div
        {...getRootProps({
          className: "border-1 border-slate-500 p-2",
        })}
      >
        <input
          type="text"
          {...getInputProps()}
          placeholder="drop your file here.."
          className="placeholder:text-black"
        />
        {isDragActive ? (
          <p className="text-sm text-slate-700">Drop file here...</p>
        ) : (
          <p className="flex flex-col items-center justify-center text-5xl text-slate-700">
            <TbCloudUpload />
            <span className="text-sm">
              Drag 'n' drop some files here, or click to select files
            </span>
          </p>
        )}
      </div>
    </div>
  );
};

export default FileUpload;

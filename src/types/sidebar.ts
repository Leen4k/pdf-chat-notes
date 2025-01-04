import { Chat } from "./chat";

export interface DocumentChat {
  id: string;
  pdfName: string;
  pdfUrl: string;
  createdAt: string;
  isSelected: boolean;
  chatId: string;
}

export interface TrashItem {
  id: string;
  fileName: string;
  fileId: string;
}

export interface DialogConfig {
  isOpen: boolean;
  type: "softDelete" | "restore" | "hardDelete" | null;
  fileId: string | null;
  title: string;
  description: string;
  actionLabel: string;
  actionButtonClass?: string;
}

export interface RenameDialogState {
  isOpen: boolean;
  fileId: string | null;
  currentName: string;
}

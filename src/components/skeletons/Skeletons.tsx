import { SidebarMenuItem } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

interface SkeletonProps {
  count?: number;
}

export const ChatSkeleton = ({ count = 3 }: SkeletonProps) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <SidebarMenuItem key={i}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.25 * i }}
          className="flex items-center w-full space-x-4 p-2"
        >
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 flex-grow" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-8 w-8" />
        </motion.div>
      </SidebarMenuItem>
    ))}
  </>
);

export const TrashSkeleton = ({ count = 2 }: SkeletonProps) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <SidebarMenuItem key={i}>
        <div className="flex items-center w-full space-x-4 p-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 flex-grow" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </SidebarMenuItem>
    ))}
  </>
);

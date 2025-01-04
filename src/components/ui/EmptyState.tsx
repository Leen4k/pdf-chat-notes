interface EmptyStateProps {
  message: string;
}

export const EmptyState = ({ message }: EmptyStateProps) => (
  <div className="flex items-center justify-center h-[180px] text-center py-4 text-muted-foreground">
    {message}
  </div>
); 
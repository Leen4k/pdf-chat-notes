  // Mutation for deleting a file
  const deleteFileMutation = useMutation({
    mutationFn: deleteFile,
    onMutate: async (fileId) => {
      // Optimistically remove the file from the list
      await queryClient.cancelQueries({ queryKey: ["documentChats", chatId] });

      const previousChats = queryClient.getQueryData(["documentChats", chatId]);

      queryClient.setQueryData(
        ["documentChats", chatId],
        (oldChats: DocumentChat[]) =>
          oldChats.filter((chat) => chat.id !== fileId)
      );

      return { previousChats };
    },
    onError: (err, fileId, context) => {
      // Restore previous state if deletion fails
      queryClient.setQueryData(
        ["documentChats", chatId],
        context?.previousChats
      );
    },
    onSettled: () => {
      // Refresh the query after deletion

      queryClient.invalidateQueries({ queryKey: ["documentChats", chatId] });
      // Reset the fileToDelete state
      setFileToDelete(null);
    },
  });
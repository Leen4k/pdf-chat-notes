import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Search, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Badge } from "./ui/badge";
import debounce from "lodash/debounce";

export function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await axios.post("/api/search", { query });
      return response.data;
    },
  });

  const debouncedSearch = useMemo(
    () =>
      debounce((query: string) => {
        if (query.trim()) {
          searchMutation.mutate(query);
        }
      }, 300),
    []
  );

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchMutation.mutate(searchQuery);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  const hasResults = searchMutation.data?.results?.length > 0;
  const hasSearched = searchMutation.isSuccess;

  return (
    <>
      <Button
        variant="outline"
        className="w-full justify-start text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        Search content...
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-y-scroll">
          <DialogHeader>
            <DialogTitle>Search PDF Content</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search in your PDFs..."
                value={searchQuery}
                onChange={handleInputChange}
                autoFocus
              />
              <Button
                type="submit"
                disabled={!searchQuery.trim() || searchMutation.isPending}
              >
                {searchMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>

            {hasSearched && (
              <>
                {hasResults ? (
                  <p className="text-sm text-muted-foreground">
                    Found {searchMutation.data.totalMatches} matches in{" "}
                    {searchMutation.data.results.length} files
                  </p>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">
                      No results found for "{searchQuery}"
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Try different keywords or check your spelling
                    </p>
                  </div>
                )}
              </>
            )}

            <div className="space-y-2">
              {searchMutation.isPending ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                searchMutation.data?.results?.map((result: any) => (
                  <div
                    key={result.fileId}
                    className="p-4 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => {
                      router.push(
                        `/chats/${result.chatId}?pdfUrl=${encodeURIComponent(
                          result.fileUrl
                        )}&searchQuery=${encodeURIComponent(searchQuery)}`
                      );
                      setOpen(false);
                    }}
                  >
                    <div className="flex items-center justify-between truncate">
                      <h3
                        className="font-medium truncate"
                        dangerouslySetInnerHTML={{
                          __html: result.highlightedFileName,
                        }}
                      />
                      <Badge className="text-xs inline whitespace-nowrap">
                        {result.matches} matches
                      </Badge>
                    </div>
                    <p
                      className="text-sm text-muted-foreground line-clamp-2 mt-1"
                      dangerouslySetInnerHTML={{ __html: result.content }}
                    />
                  </div>
                ))
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

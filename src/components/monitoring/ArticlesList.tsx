import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";

interface ArticlesListProps {
  filters: {
    dateRange: { from: string; to: string };
    source: string;
    keyword: string;
    sortOrder: string;
  };
}

export const ArticlesList = ({ filters }: ArticlesListProps) => {
  const queryClient = useQueryClient();
  const [selectedArticle, setSelectedArticle] = useState<any>(null);

  const { data: articles, isLoading } = useQuery({
    queryKey: ['articles', filters],
    queryFn: async () => {
      let query = supabase
        .from('articles')
        .select(`
          *,
          matches:matches(
            keyword:keywords(term)
          )
        `);

      if (filters.dateRange.from) {
        query = query.gte('crawled_at', filters.dateRange.from);
      }
      if (filters.dateRange.to) {
        query = query.lte('crawled_at', filters.dateRange.to);
      }
      if (filters.source) {
        query = query.eq('source', filters.source);
      }
      
      query = query.order('crawled_at', { 
        ascending: filters.sortOrder === 'oldest' 
      });

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel('articles_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'articles' 
        }, 
        () => {
          queryClient.invalidateQueries({ queryKey: ['articles'] });
        }
      )
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['articles'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  if (isLoading) {
    return <div>Loading articles...</div>;
  }

  return (
    <>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Matched Keywords</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {articles?.map((article) => (
              <TableRow key={article.id}>
                <TableCell className="font-medium">{article.title}</TableCell>
                <TableCell>{article.source}</TableCell>
                <TableCell>
                  {article.matches
                    ?.map((match) => match.keyword?.term)
                    .filter(Boolean)
                    .join(", ")}
                </TableCell>
                <TableCell>
                  {new Date(article.crawled_at).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedArticle(article)}
                  >
                    Preview
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedArticle} onOpenChange={() => setSelectedArticle(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedArticle?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <strong>Source:</strong> {selectedArticle?.source}
            </div>
            <div>
              <strong>URL:</strong>{" "}
              <a
                href={selectedArticle?.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                {selectedArticle?.url}
              </a>
            </div>
            <div>
              <strong>Matched Keywords:</strong>{" "}
              {selectedArticle?.matches
                ?.map((match) => match.keyword?.term)
                .filter(Boolean)
                .join(", ")}
            </div>
            <div>
              <strong>Content:</strong>
              <div className="mt-2 prose max-w-none">
                {selectedArticle?.content}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
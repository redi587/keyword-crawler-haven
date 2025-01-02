import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getLocalISOString } from "@/lib/timeUtils";
import { TimeStampCell } from "./components/TimeStampCell";
import { ArticlePreviewDialog } from "./components/ArticlePreviewDialog";
import { useArticlePreview } from "./hooks/useArticlePreview";

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
  const { selectedArticle, setSelectedArticle } = useArticlePreview();

  const { data: articles, isLoading, error } = useQuery({
    queryKey: ['articles', filters],
    queryFn: async () => {
      try {
        let query = supabase
          .from('articles')
          .select(`
            *,
            matches:matches(
              keyword:keywords(term)
            )
          `);

        if (filters.dateRange.from) {
          const fromDate = new Date(filters.dateRange.from);
          query = query.gte('crawled_at', getLocalISOString(fromDate));
        }
        if (filters.dateRange.to) {
          const toDate = new Date(filters.dateRange.to);
          toDate.setHours(23, 59, 59, 999);
          query = query.lte('crawled_at', getLocalISOString(toDate));
        }
        if (filters.source && filters.source !== 'all') {
          query = query.eq('source', filters.source);
        }
        if (filters.keyword) {
          query = query.textSearch('title', filters.keyword);
        }
        
        query = query.order('crawled_at', { 
          ascending: filters.sortOrder === 'oldest' 
        });

        const { data, error } = await query;
        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error fetching articles:', error);
        throw error;
      }
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
    return <div className="text-center py-4">Loading articles...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error loading articles. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (!articles?.length) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No articles found matching your criteria. Try adjusting your filters.
        </AlertDescription>
      </Alert>
    );
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
                  <TimeStampCell timestamp={article.crawled_at} />
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

      <ArticlePreviewDialog 
        article={selectedArticle} 
        onClose={() => setSelectedArticle(null)} 
      />
    </>
  );
};
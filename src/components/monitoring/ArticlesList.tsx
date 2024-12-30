import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

  // Set up real-time subscription for new articles and matches
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
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Matched Keywords</TableHead>
            <TableHead>Timestamp</TableHead>
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
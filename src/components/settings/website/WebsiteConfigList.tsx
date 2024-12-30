import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Database } from "@/types/supabase";

type CrawlerConfig = Database['public']['Tables']['crawler_configs']['Row'];

export const WebsiteConfigList = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: configs, isLoading } = useQuery({
    queryKey: ['crawler-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crawler_configs')
        .select('*')
        .order('id', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const deleteConfig = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('crawler_configs')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crawler-configs'] });
      toast({
        title: "Success",
        description: "Website configuration deleted successfully",
      });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      const { error } = await supabase
        .from('crawler_configs')
        .update({ active })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crawler-configs'] });
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>URL</TableHead>
          <TableHead>Start Time</TableHead>
          <TableHead>End Time</TableHead>
          <TableHead>Interval</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {configs?.map((config) => (
          <TableRow key={config.id}>
            <TableCell>{config.url}</TableCell>
            <TableCell>{config.start_time || '-'}</TableCell>
            <TableCell>{config.end_time || '-'}</TableCell>
            <TableCell>{config.check_interval || '-'}</TableCell>
            <TableCell>
              <Switch
                checked={config.active}
                onCheckedChange={(checked) => 
                  toggleActive.mutate({ id: config.id, active: checked })
                }
              />
            </TableCell>
            <TableCell>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteConfig.mutate(config.id)}
              >
                Delete
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
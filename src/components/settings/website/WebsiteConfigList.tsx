import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Pencil, X, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Database } from "@/types/supabase";

type CrawlerConfig = Database['public']['Tables']['crawler_configs']['Row'];

export const WebsiteConfigList = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Partial<CrawlerConfig>>({});

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

  const updateConfig = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CrawlerConfig> & { id: number }) => {
      const { error } = await supabase
        .from('crawler_configs')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crawler-configs'] });
      toast({
        title: "Success",
        description: "Website configuration updated successfully",
      });
      setEditingId(null);
      setEditValues({});
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update website configuration",
        variant: "destructive",
      });
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

  const crawlWebsite = useMutation({
    mutationFn: async (url: string) => {
      const { data, error } = await supabase.functions.invoke('crawl-website', {
        body: { url },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Website crawled successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to crawl website",
        variant: "destructive",
      });
    },
  });

  const startEditing = (config: CrawlerConfig) => {
    setEditingId(config.id);
    setEditValues({
      start_time: config.start_time || '',
      end_time: config.end_time || '',
      check_interval: config.check_interval || 0,
    });
  };

  const handleSave = (id: number) => {
    updateConfig.mutate({ id, ...editValues });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValues({});
  };

  const handleChange = (field: keyof CrawlerConfig, value: string | number) => {
    setEditValues(prev => ({ ...prev, [field]: value }));
  };

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
          <TableHead>Interval (minutes)</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {configs?.map((config) => (
          <TableRow key={config.id}>
            <TableCell>{config.url}</TableCell>
            <TableCell>
              {editingId === config.id ? (
                <Input
                  type="time"
                  value={editValues.start_time || ''}
                  onChange={(e) => handleChange('start_time', e.target.value)}
                  className="w-32"
                />
              ) : (
                config.start_time || '-'
              )}
            </TableCell>
            <TableCell>
              {editingId === config.id ? (
                <Input
                  type="time"
                  value={editValues.end_time || ''}
                  onChange={(e) => handleChange('end_time', e.target.value)}
                  className="w-32"
                />
              ) : (
                config.end_time || '-'
              )}
            </TableCell>
            <TableCell>
              {editingId === config.id ? (
                <Input
                  type="number"
                  value={editValues.check_interval || ''}
                  onChange={(e) => handleChange('check_interval', parseInt(e.target.value) || 0)}
                  min="1"
                  className="w-24"
                />
              ) : (
                config.check_interval ? `${config.check_interval} min` : '-'
              )}
            </TableCell>
            <TableCell>
              <Switch
                checked={config.active}
                onCheckedChange={(checked) => 
                  toggleActive.mutate({ id: config.id, active: checked })
                }
              />
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                {editingId === config.id ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSave(config.id)}
                      disabled={updateConfig.isPending}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancel}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEditing(config)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => crawlWebsite.mutate(config.url)}
                  disabled={crawlWebsite.isPending}
                >
                  {crawlWebsite.isPending ? "Crawling..." : "Crawl"}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteConfig.mutate(config.id)}
                >
                  Delete
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

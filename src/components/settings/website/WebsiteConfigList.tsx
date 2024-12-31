import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { WebsiteConfigTable } from "./components/WebsiteConfigTable";
import type { Database } from "@/types/supabase";

type CrawlerConfig = Database['public']['Tables']['crawler_configs']['Row'];

export const WebsiteConfigList = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);

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

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <WebsiteConfigTable
      configs={configs || []}
      editingId={editingId}
      onEdit={(id, updates) => updateConfig.mutate({ id, ...updates })}
      onDelete={(id) => deleteConfig.mutate(id)}
      onToggleActive={(id, active) => toggleActive.mutate({ id, active })}
      onCrawl={(url) => crawlWebsite.mutate(url)}
      onStartEditing={setEditingId}
      onCancelEditing={() => setEditingId(null)}
    />
  );
};
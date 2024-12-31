import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

type CrawlerConfig = Database['public']['Tables']['crawler_configs']['Row'];

interface WebsiteConfigFormProps {
  onSuccess: () => void;
}

export const WebsiteConfigForm = ({ onSuccess }: WebsiteConfigFormProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newUrl, setNewUrl] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [interval, setInterval] = useState("");

  const addConfig = useMutation({
    mutationFn: async (newConfig: Omit<CrawlerConfig, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('crawler_configs')
        .insert([newConfig])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crawler-configs'] });
      toast({
        title: "Success",
        description: "Website configuration added successfully",
      });
      setNewUrl("");
      setStartTime("");
      setEndTime("");
      setInterval("");
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add website configuration",
        variant: "destructive",
      });
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addConfig.mutate({
      url: newUrl,
      start_time: startTime || null,
      end_time: endTime || null,
      check_interval: interval ? parseInt(interval) : null,
      active: true,
    });
  };

  const handleCrawl = () => {
    if (newUrl) {
      crawlWebsite.mutate(newUrl);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Website URL</label>
          <Input
            type="url"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://example.com"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Start Time</label>
          <Input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">End Time</label>
          <Input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Check Interval (minutes)</label>
          <Input
            type="number"
            value={interval}
            onChange={(e) => setInterval(e.target.value)}
            min="1"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={addConfig.isPending}>
          {addConfig.isPending ? "Adding..." : "Add Website"}
        </Button>
        <Button 
          type="button" 
          variant="secondary"
          onClick={handleCrawl}
          disabled={!newUrl || crawlWebsite.isPending}
        >
          {crawlWebsite.isPending ? "Crawling..." : "Crawl Now"}
        </Button>
      </div>
    </form>
  );
};
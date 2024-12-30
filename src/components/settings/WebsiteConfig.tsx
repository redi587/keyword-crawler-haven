import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Database } from "@/types/supabase";

type CrawlerConfig = Database['public']['Tables']['crawler_configs']['Row'];

export const WebsiteConfig = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newUrl, setNewUrl] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [interval, setInterval] = useState("");

  // Fetch configs
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

  // Add config mutation
  const addConfig = useMutation({
    mutationFn: async (newConfig: Omit<CrawlerConfig, 'id'>) => {
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
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add website configuration",
        variant: "destructive",
      });
    },
  });

  // Delete config mutation
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

  // Toggle active status mutation
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

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('crawler_configs_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'crawler_configs' 
        }, 
        () => {
          queryClient.invalidateQueries({ queryKey: ['crawler-configs'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return (
    <div className="space-y-6">
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
        <Button type="submit" disabled={addConfig.isPending}>
          {addConfig.isPending ? "Adding..." : "Add Website"}
        </Button>
      </form>

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
    </div>
  );
};
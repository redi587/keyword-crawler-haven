import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type Keyword = Database['public']['Tables']['keywords']['Row'];

export const KeywordsManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newKeyword, setNewKeyword] = useState("");

  // Fetch keywords
  const { data: keywords, isLoading } = useQuery({
    queryKey: ['keywords'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('keywords')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Add keyword mutation
  const addKeyword = useMutation({
    mutationFn: async (term: string) => {
      const { data, error } = await supabase
        .from('keywords')
        .insert([{ term }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keywords'] });
      toast({
        title: "Success",
        description: "Keyword added successfully",
      });
      setNewKeyword("");
    },
  });

  // Delete keyword mutation
  const deleteKeyword = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('keywords')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keywords'] });
      toast({
        title: "Success",
        description: "Keyword deleted successfully",
      });
    },
  });

  // Toggle active status mutation
  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      const { error } = await supabase
        .from('keywords')
        .update({ active })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keywords'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newKeyword.trim()) {
      addKeyword.mutate(newKeyword.trim());
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('keywords_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'keywords' 
        }, 
        () => {
          queryClient.invalidateQueries({ queryKey: ['keywords'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="flex gap-4">
        <Input
          value={newKeyword}
          onChange={(e) => setNewKeyword(e.target.value)}
          placeholder="Enter new keyword"
          className="max-w-sm"
        />
        <Button type="submit" disabled={addKeyword.isPending}>
          {addKeyword.isPending ? "Adding..." : "Add Keyword"}
        </Button>
      </form>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Keyword</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {keywords?.map((keyword) => (
            <TableRow key={keyword.id}>
              <TableCell>{keyword.term}</TableCell>
              <TableCell>
                {new Date(keyword.created_at).toLocaleString()}
              </TableCell>
              <TableCell>
                <Switch
                  checked={keyword.active}
                  onCheckedChange={(checked) => 
                    toggleActive.mutate({ id: keyword.id, active: checked })
                  }
                />
              </TableCell>
              <TableCell>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteKeyword.mutate(keyword.id)}
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
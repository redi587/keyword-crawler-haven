import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

type EmailConfig = {
  id: number;
  email: string;
  active: boolean;
};

interface EmailRecipientListProps {
  emailConfigs: EmailConfig[];
  isLoading: boolean;
}

export const EmailRecipientList = ({ emailConfigs, isLoading }: EmailRecipientListProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      const { error } = await supabase
        .from('email_configs')
        .update({ active })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-configs'] });
    },
  });

  const deleteEmail = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('email_configs')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-configs'] });
      toast({
        title: "Success",
        description: "Email configuration removed successfully",
      });
    },
  });

  if (isLoading) {
    return <div>Loading email configurations...</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {emailConfigs?.map((config) => (
          <TableRow key={config.id}>
            <TableCell>{config.email}</TableCell>
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
                onClick={() => deleteEmail.mutate(config.id)}
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
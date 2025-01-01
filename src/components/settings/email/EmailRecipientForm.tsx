import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useState } from "react";

export const EmailRecipientForm = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newEmail, setNewEmail] = useState("");

  const addEmail = useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase
        .from('email_configs')
        .insert([{ email }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-configs'] });
      setNewEmail("");
      toast({
        title: "Success",
        description: "Email configuration added successfully",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newEmail) {
      addEmail.mutate(newEmail);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-4">
        <Input
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="Enter email for notifications"
          required
        />
        <Button type="submit" disabled={addEmail.isPending}>
          {addEmail.isPending ? "Adding..." : "Add Email"}
        </Button>
      </div>
    </form>
  );
};
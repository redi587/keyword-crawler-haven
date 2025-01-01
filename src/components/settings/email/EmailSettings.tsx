import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { EmailRecipientForm } from "./EmailRecipientForm";
import { EmailRecipientList } from "./EmailRecipientList";

export const EmailSettings = () => {
  const { data: emailConfigs, isLoading } = useQuery({
    queryKey: ['email-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_configs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <EmailRecipientForm />
      <EmailRecipientList 
        emailConfigs={emailConfigs || []} 
        isLoading={isLoading} 
      />
    </div>
  );
};
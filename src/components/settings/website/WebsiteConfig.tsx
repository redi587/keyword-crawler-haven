import { useEffect } from "react";
import { WebsiteConfigForm } from "./WebsiteConfigForm";
import { WebsiteConfigList } from "./WebsiteConfigList";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";

export const WebsiteConfig = () => {
  const queryClient = useQueryClient();

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
      <WebsiteConfigForm onSuccess={() => {}} />
      <WebsiteConfigList />
    </div>
  );
};
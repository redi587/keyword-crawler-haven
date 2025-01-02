import { useState } from "react";
import type { Database } from "@/types/supabase";

type Article = Database['public']['Tables']['articles']['Row'] & {
  matches: Array<{
    keyword?: {
      term: string;
    };
  }>;
};

export const useArticlePreview = () => {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  return {
    selectedArticle,
    setSelectedArticle,
  };
};
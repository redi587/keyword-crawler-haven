import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDateTime } from "@/lib/timeUtils";
import type { Database } from "@/types/supabase";

type Article = Database['public']['Tables']['articles']['Row'] & {
  matches: Array<{
    keyword?: {
      term: string;
    };
  }>;
};

interface ArticlePreviewDialogProps {
  article: Article | null;
  onClose: () => void;
}

export const ArticlePreviewDialog = ({ article, onClose }: ArticlePreviewDialogProps) => {
  if (!article) return null;

  return (
    <Dialog open={!!article} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{article.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <strong>Source:</strong> {article.source}
          </div>
          <div>
            <strong>URL:</strong>{" "}
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              {article.url}
            </a>
          </div>
          <div>
            <strong>Crawled At:</strong>{" "}
            {formatDateTime(article.crawled_at)}
          </div>
          <div>
            <strong>Matched Keywords:</strong>{" "}
            {article.matches
              ?.map((match) => match.keyword?.term)
              .filter(Boolean)
              .join(", ")}
          </div>
          <div>
            <strong>Content:</strong>
            <div className="mt-2 prose max-w-none">
              {article.content}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
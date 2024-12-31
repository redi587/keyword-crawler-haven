import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { WebsiteConfigRow } from "./WebsiteConfigRow";
import type { Database } from "@/types/supabase";

type CrawlerConfig = Database['public']['Tables']['crawler_configs']['Row'];

interface WebsiteConfigTableProps {
  configs: CrawlerConfig[];
  editingId: number | null;
  onEdit: (id: number, updates: Partial<CrawlerConfig>) => void;
  onDelete: (id: number) => void;
  onToggleActive: (id: number, active: boolean) => void;
  onCrawl: (url: string) => void;
  onStartEditing: (id: number) => void;
  onCancelEditing: () => void;
}

export const WebsiteConfigTable = ({
  configs,
  editingId,
  onEdit,
  onDelete,
  onToggleActive,
  onCrawl,
  onStartEditing,
  onCancelEditing,
}: WebsiteConfigTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>URL</TableHead>
          <TableHead>Start Time</TableHead>
          <TableHead>End Time</TableHead>
          <TableHead>Interval (minutes)</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {configs?.map((config) => (
          <WebsiteConfigRow
            key={config.id}
            config={config}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleActive={onToggleActive}
            onCrawl={onCrawl}
            isEditing={editingId === config.id}
            onStartEditing={() => onStartEditing(config.id)}
            onCancelEditing={onCancelEditing}
          />
        ))}
      </TableBody>
    </Table>
  );
};
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { TableCell, TableRow } from "@/components/ui/table";
import { TimeDisplay } from "./TimeDisplay";
import { ActionButtons } from "./ActionButtons";
import { getNextCrawlTime } from "@/lib/utils";
import type { Database } from "@/types/supabase";

type CrawlerConfig = Database['public']['Tables']['crawler_configs']['Row'];

interface WebsiteConfigRowProps {
  config: CrawlerConfig;
  onEdit: (id: number, updates: Partial<CrawlerConfig>) => void;
  onDelete: (id: number) => void;
  onToggleActive: (id: number, active: boolean) => void;
  onCrawl: (url: string) => void;
  isEditing: boolean;
  onStartEditing: () => void;
  onCancelEditing: () => void;
}

export const WebsiteConfigRow = ({
  config,
  onEdit,
  onDelete,
  onToggleActive,
  onCrawl,
  isEditing,
  onStartEditing,
  onCancelEditing,
}: WebsiteConfigRowProps) => {
  const [editValues, setEditValues] = useState<Partial<CrawlerConfig>>({
    start_time: config.start_time || '',
    end_time: config.end_time || '',
    check_interval: config.check_interval || 0,
  });

  const handleChange = (field: keyof CrawlerConfig, value: string | number) => {
    setEditValues(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // Validate time format before saving
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    const startTimeValid = !editValues.start_time || timeRegex.test(editValues.start_time);
    const endTimeValid = !editValues.end_time || timeRegex.test(editValues.end_time);

    if (!startTimeValid || !endTimeValid) {
      console.error('Invalid time format');
      return;
    }

    onEdit(config.id, editValues);
  };

  const nextCrawl = getNextCrawlTime(config);

  return (
    <TableRow>
      <TableCell>{config.url}</TableCell>
      <TableCell>
        <TimeDisplay
          time={isEditing ? editValues.start_time : config.start_time}
          isEditing={isEditing}
          onChange={(value) => handleChange('start_time', value)}
          label="Start Time"
        />
      </TableCell>
      <TableCell>
        <TimeDisplay
          time={isEditing ? editValues.end_time : config.end_time}
          isEditing={isEditing}
          onChange={(value) => handleChange('end_time', value)}
          label="End Time"
        />
      </TableCell>
      <TableCell>
        {isEditing ? (
          <Input
            type="number"
            value={editValues.check_interval || ''}
            onChange={(e) => handleChange('check_interval', parseInt(e.target.value) || 0)}
            min="1"
            className="w-24"
          />
        ) : (
          config.check_interval ? `${config.check_interval} min` : '-'
        )}
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Switch
              checked={config.active}
              onCheckedChange={(checked) => onToggleActive(config.id, checked)}
            />
            <span className="text-sm">
              {config.active ? 'Active' : 'Inactive'}
            </span>
          </div>
          {config.active && nextCrawl && (
            <span className="text-xs text-muted-foreground">
              Next: {nextCrawl}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <ActionButtons
          isEditing={isEditing}
          onSave={handleSave}
          onCancel={onCancelEditing}
          onStartEditing={onStartEditing}
          onCrawl={() => onCrawl(config.url)}
          onDelete={() => onDelete(config.id)}
        />
      </TableCell>
    </TableRow>
  );
};
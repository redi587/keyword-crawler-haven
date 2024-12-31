import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { TableCell, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Check, X, Pencil, Play } from "lucide-react";
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
    onEdit(config.id, editValues);
  };

  const getNextCrawlTime = () => {
    if (!config.active || !config.check_interval) return null;
    const now = new Date();
    const startTime = config.start_time ? new Date(`1970-01-01T${config.start_time}`) : null;
    const endTime = config.end_time ? new Date(`1970-01-01T${config.end_time}`) : null;
    
    if (startTime && endTime) {
      const currentTime = new Date();
      currentTime.setFullYear(1970, 0, 1);
      
      if (currentTime < startTime) {
        return `Today at ${config.start_time}`;
      } else if (currentTime > endTime) {
        return `Tomorrow at ${config.start_time}`;
      }
    }
    
    return `In ${config.check_interval} minutes`;
  };

  const nextCrawl = getNextCrawlTime();

  return (
    <TableRow>
      <TableCell>{config.url}</TableCell>
      <TableCell>
        {isEditing ? (
          <Input
            type="time"
            value={editValues.start_time || ''}
            onChange={(e) => handleChange('start_time', e.target.value)}
            className="w-32"
          />
        ) : (
          config.start_time || '-'
        )}
      </TableCell>
      <TableCell>
        {isEditing ? (
          <Input
            type="time"
            value={editValues.end_time || ''}
            onChange={(e) => handleChange('end_time', e.target.value)}
            className="w-32"
          />
        ) : (
          config.end_time || '-'
        )}
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
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSave}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancelEditing}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={onStartEditing}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onCrawl(config.url)}
              >
                <Play className="h-4 w-4 mr-1" />
                Crawl
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Manually trigger a crawl of this website now</p>
            </TooltipContent>
          </Tooltip>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(config.id)}
          >
            Delete
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { TimeDisplay } from "./TimeDisplay";
import { formatTime, getNextCrawlTime } from "@/lib/utils";
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
  const [editValues, setEditValues] = useState({
    url: config.url,
    start_time: config.start_time,
    end_time: config.end_time,
    check_interval: config.check_interval,
  });

  const handleTimeChange = (field: 'start_time' | 'end_time') => (value: string) => {
    setEditValues(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleIntervalChange = (value: string) => {
    const interval = value ? parseInt(value) : null;
    setEditValues(prev => ({
      ...prev,
      check_interval: interval,
    }));
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

  return (
    <tr className="border-b">
      <td className="p-2">
        {isEditing ? (
          <input
            type="url"
            value={editValues.url}
            onChange={(e) => setEditValues(prev => ({ ...prev, url: e.target.value }))}
            className="w-full p-1 border rounded"
          />
        ) : (
          config.url
        )}
      </td>
      <td className="p-2">
        <TimeDisplay
          time={isEditing ? editValues.start_time : config.start_time}
          isEditing={isEditing}
          onChange={handleTimeChange('start_time')}
          label="Start Time"
        />
      </td>
      <td className="p-2">
        <TimeDisplay
          time={isEditing ? editValues.end_time : config.end_time}
          isEditing={isEditing}
          onChange={handleTimeChange('end_time')}
          label="End Time"
        />
      </td>
      <td className="p-2">
        {isEditing ? (
          <input
            type="number"
            value={editValues.check_interval || ''}
            onChange={(e) => handleIntervalChange(e.target.value)}
            className="w-20 p-1 border rounded"
            min="1"
          />
        ) : (
          config.check_interval || '-'
        )}
      </td>
      <td className="p-2">
        <Switch
          checked={config.active || false}
          onCheckedChange={(checked) => onToggleActive(config.id, checked)}
        />
      </td>
      <td className="p-2">
        {getNextCrawlTime(config)}
      </td>
      <td className="p-2">
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button size="sm" onClick={handleSave}>Save</Button>
              <Button size="sm" variant="outline" onClick={onCancelEditing}>Cancel</Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={onStartEditing}>Edit</Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => onDelete(config.id)}
                className="text-red-500 hover:text-red-700"
              >
                Delete
              </Button>
              <Button 
                size="sm"
                variant="outline"
                onClick={() => onCrawl(config.url)}
              >
                Crawl Now
              </Button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
};
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Database } from "../../../integrations/supabase/types";

interface CrawlerConfig {
  id: number;
  url: string;
  start_time: string | null;
  end_time: string | null;
  check_interval: number | null;
  active: boolean | null;
  created_at: string | null;
}

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
    start_time: config.start_time || "",
    end_time: config.end_time || "",
    check_interval: config.check_interval || "",
  });

  const formatTime = (time: string | null): string => {
    if (!time) return "";
    try {
      // Ensure time is in HH:mm format
      const [hours, minutes] = time.split(":");
      const formattedHours = hours.padStart(2, "0");
      const formattedMinutes = minutes ? minutes.padStart(2, "0") : "00";
      return `${formattedHours}:${formattedMinutes}`;
    } catch (e) {
      console.error('Error formatting time:', e);
      return "";
    }
  };

  const handleTimeChange = (field: 'start_time' | 'end_time') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    if (!newTime || /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(newTime)) {
      setEditValues(prev => ({
        ...prev,
        [field]: newTime,
      }));
    }
  };

  const validateTimeRange = (): boolean => {
    if (!editValues.start_time || !editValues.end_time) return true;
    
    const [startHours, startMinutes] = editValues.start_time.split(':').map(Number);
    const [endHours, endMinutes] = editValues.end_time.split(':').map(Number);
    
    const startTotal = startHours * 60 + startMinutes;
    const endTotal = endHours * 60 + endMinutes;
    
    return startTotal < endTotal;
  };

  const handleSave = () => {
    if (!validateTimeRange()) {
      alert("End time must be after start time");
      return;
    }

    const updates: Partial<CrawlerConfig> = {
      url: editValues.url,
      start_time: editValues.start_time || null,
      end_time: editValues.end_time || null,
      check_interval: editValues.check_interval ? parseInt(String(editValues.check_interval)) : null,
    };

    onEdit(config.id, updates);
  };

  const displayTime = (time: string | null): string => {
    if (!time) return "-";
    return formatTime(time);
  };

  return (
    <tr className="border-b">
      <td className="p-2">
        {isEditing ? (
          <Input
            type="url"
            value={editValues.url}
            onChange={(e) => setEditValues(prev => ({ ...prev, url: e.target.value }))}
            className="w-full"
          />
        ) : (
          config.url
        )}
      </td>
      <td className="p-2">
        {isEditing ? (
          <Input
            type="time"
            value={formatTime(editValues.start_time)}
            onChange={handleTimeChange('start_time')}
            className="w-32"
          />
        ) : (
          displayTime(config.start_time)
        )}
      </td>
      <td className="p-2">
        {isEditing ? (
          <Input
            type="time"
            value={formatTime(editValues.end_time)}
            onChange={handleTimeChange('end_time')}
            className="w-32"
          />
        ) : (
          displayTime(config.end_time)
        )}
      </td>
      <td className="p-2">
        {isEditing ? (
          <Input
            type="number"
            value={editValues.check_interval}
            onChange={(e) => setEditValues(prev => ({ ...prev, check_interval: e.target.value }))}
            className="w-20"
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

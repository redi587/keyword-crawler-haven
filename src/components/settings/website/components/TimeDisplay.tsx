import { Input } from "@/components/ui/input";

interface TimeDisplayProps {
  time: string | null;
  isEditing: boolean;
  onChange: (value: string) => void;
  label: string;
}

export const TimeDisplay = ({ time, isEditing, onChange, label }: TimeDisplayProps) => {
  const formatTime = (time: string | null): string => {
    if (!time) return '-';
    try {
      // Ensure consistent 24-hour format
      const [hours, minutes] = time.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toLocaleTimeString('en-GB', { 
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch (e) {
      console.error('Error formatting time:', e);
      return '-';
    }
  };

  return isEditing ? (
    <Input
      type="time"
      value={time || ''}
      onChange={(e) => onChange(e.target.value)}
      className="w-32"
      aria-label={label}
    />
  ) : (
    <span>{formatTime(time)}</span>
  );
};
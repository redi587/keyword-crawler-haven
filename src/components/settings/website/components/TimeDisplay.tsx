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
      // Parse the time string and ensure it's in 24-hour format
      const [hours, minutes] = time.split(':').map(num => num.padStart(2, '0'));
      return `${hours}:${minutes}`;
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
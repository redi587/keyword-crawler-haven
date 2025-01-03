import { Input } from "@/components/ui/input";

interface TimeDisplayProps {
  time: string | null;
  isEditing: boolean;
  onChange: (time: string) => void;
  label: string;
}

export const TimeDisplay = ({ time, isEditing, onChange, label }: TimeDisplayProps) => {
  if (isEditing) {
    return (
      <Input
        type="time"
        value={time || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-32"
        aria-label={label}
      />
    );
  }

  // If there's no time set, show a dash
  if (!time) return <span>-</span>;

  // Format the time for display (HH:MM)
  try {
    const [hours, minutes] = time.split(':');
    const formattedTime = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
    return <span>{formattedTime}</span>;
  } catch (e) {
    console.error('Error formatting time:', e);
    return <span>{time}</span>;
  }
};
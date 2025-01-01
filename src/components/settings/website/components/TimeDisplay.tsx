import { Input } from "@/components/ui/input";
import { formatTime } from "@/lib/utils";

interface TimeDisplayProps {
  time: string | null;
  isEditing: boolean;
  onChange: (value: string) => void;
  label: string;
}

export const TimeDisplay = ({ time, isEditing, onChange, label }: TimeDisplayProps) => {
  return isEditing ? (
    <Input
      type="time"
      value={time || ''}
      onChange={(e) => onChange(e.target.value)}
      className="w-32"
      aria-label={label}
    />
  ) : (
    formatTime(time)
  );
};
import { formatDateTime } from "@/lib/timeUtils";

interface TimeStampCellProps {
  timestamp: string;
}

export const TimeStampCell = ({ timestamp }: TimeStampCellProps) => {
  return (
    <div className="whitespace-nowrap">
      {formatDateTime(timestamp)}
    </div>
  );
};
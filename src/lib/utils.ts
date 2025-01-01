import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatTime = (time: string | null) => {
  if (!time) return '-';
  try {
    // Convert 24-hour format to 12-hour format for display
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric',
      minute: '2-digit',
      hour12: true 
    });
  } catch (e) {
    return time;
  }
};

export const getNextCrawlTime = (config: { active: boolean; check_interval: number | null; start_time: string | null; end_time: string | null }) => {
  if (!config.active || !config.check_interval) return null;
  
  const now = new Date();
  const startTime = config.start_time ? new Date(`1970-01-01T${config.start_time}`) : null;
  const endTime = config.end_time ? new Date(`1970-01-01T${config.end_time}`) : null;
  
  if (startTime && endTime) {
    const currentTime = new Date();
    currentTime.setFullYear(1970, 0, 1);
    
    if (currentTime < startTime) {
      return `Today at ${formatTime(config.start_time)}`;
    } else if (currentTime > endTime) {
      return `Tomorrow at ${formatTime(config.start_time)}`;
    }
  }
  
  return `In ${config.check_interval} minutes`;
};
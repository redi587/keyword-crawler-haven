import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Check, X, Pencil, Play } from "lucide-react";

interface ActionButtonsProps {
  isEditing: boolean;
  onSave: () => void;
  onCancel: () => void;
  onStartEditing: () => void;
  onCrawl: () => void;
  onDelete: () => void;
}

export const ActionButtons = ({
  isEditing,
  onSave,
  onCancel,
  onStartEditing,
  onCrawl,
  onDelete,
}: ActionButtonsProps) => {
  return (
    <div className="flex gap-2">
      {isEditing ? (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={onSave}>
                <Check className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Save changes</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={onCancel}>
                <X className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Cancel editing</p>
            </TooltipContent>
          </Tooltip>
        </>
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" onClick={onStartEditing}>
              <Pencil className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Edit configuration</p>
          </TooltipContent>
        </Tooltip>
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="secondary" size="sm" onClick={onCrawl}>
            <Play className="h-4 w-4 mr-1" />
            Crawl
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Manually trigger a crawl of this website now</p>
        </TooltipContent>
      </Tooltip>
      <Button variant="destructive" size="sm" onClick={onDelete}>
        Delete
      </Button>
    </div>
  );
};
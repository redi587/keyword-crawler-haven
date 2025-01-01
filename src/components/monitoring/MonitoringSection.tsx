import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArticlesList } from "./ArticlesList";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export const MonitoringSection = () => {
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [source, setSource] = useState("");
  const [keyword, setKeyword] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [dateError, setDateError] = useState<string | null>(null);

  const validateDates = (from: string, to: string) => {
    if (from && to) {
      const fromDate = new Date(from);
      const toDate = new Date(to);
      if (fromDate > toDate) {
        setDateError("'From' date cannot be later than 'To' date");
        return false;
      }
    }
    setDateError(null);
    return true;
  };

  const handleDateChange = (field: 'from' | 'to', value: string) => {
    const newRange = { ...dateRange, [field]: value };
    setDateRange(newRange);
    validateDates(newRange.from, newRange.to);
  };

  const handleClearFilters = () => {
    setDateRange({ from: "", to: "" });
    setSource("");
    setKeyword("");
    setSortOrder("newest");
    setDateError(null);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">From Date</label>
          <Input
            type="date"
            value={dateRange.from}
            onChange={(e) => handleDateChange('from', e.target.value)}
            max={dateRange.to || undefined}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">To Date</label>
          <Input
            type="date"
            value={dateRange.to}
            onChange={(e) => handleDateChange('to', e.target.value)}
            min={dateRange.from || undefined}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Source</label>
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger>
              <SelectValue placeholder="Select source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="website1">Website 1</SelectItem>
              <SelectItem value="website2">Website 2</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Sort Order</label>
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {dateError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{dateError}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        <Input
          placeholder="Filter by keyword"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="max-w-sm"
        />
        <Button variant="secondary" onClick={handleClearFilters}>Clear Filters</Button>
      </div>

      <ArticlesList
        filters={{
          dateRange,
          source,
          keyword,
          sortOrder,
        }}
      />
    </div>
  );
};
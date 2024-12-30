import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ArticlesListProps {
  filters: {
    dateRange: { from: string; to: string };
    source: string;
    keyword: string;
    sortOrder: string;
  };
}

export const ArticlesList = ({ filters }: ArticlesListProps) => {
  // This would be replaced with actual data fetching logic
  const articles = [
    {
      id: 1,
      title: "Sample Article",
      source: "News Site",
      matchedKeywords: ["tech", "AI"],
      timestamp: new Date().toISOString(),
    },
  ];

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Matched Keywords</TableHead>
            <TableHead>Timestamp</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {articles.map((article) => (
            <TableRow key={article.id}>
              <TableCell className="font-medium">{article.title}</TableCell>
              <TableCell>{article.source}</TableCell>
              <TableCell>{article.matchedKeywords.join(", ")}</TableCell>
              <TableCell>{new Date(article.timestamp).toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
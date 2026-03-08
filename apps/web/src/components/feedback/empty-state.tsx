import { Card, CardContent } from "@/components/ui/card";

type EmptyStateProps = {
  title?: string;
  description?: string;
};

export function EmptyState({
  title = "データがありません",
  description = "条件に一致するデータは見つかりませんでした。",
}: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="py-10 text-center">
        <h2 className="text-base font-medium">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

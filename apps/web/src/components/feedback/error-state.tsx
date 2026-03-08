import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type ErrorStateProps = {
  title?: string;
  message: string;
};

export function ErrorState({ title = "データ取得に失敗しました", message }: ErrorStateProps) {
  return (
    <Alert variant="destructive">
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="break-all">{message}</AlertDescription>
    </Alert>
  );
}

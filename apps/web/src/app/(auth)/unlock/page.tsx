import { normalizeNextPath } from "@/server/uiPasswordGate";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type UnlockPageProps = {
  searchParams?: Promise<{
    next?: string;
    error?: string;
  }>;
};

export default async function UnlockPage({ searchParams }: UnlockPageProps) {
  const params = await searchParams;
  const next = normalizeNextPath(params?.next);
  const hasError = params?.error === "1";

  return (
    <main className="grid min-h-screen place-items-center px-6 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>ログイン</CardTitle>
        </CardHeader>
        <CardContent>
          <form action="/api/ui-auth" method="post" className="grid gap-4">
            <input type="hidden" name="next" value={next} />
            <Input
              id="password"
              type="password"
              name="password"
              required
              autoFocus
              aria-label="パスワード"
              placeholder="パスワード"
            />
            {hasError ? (
              <Alert variant="destructive">
                <AlertTitle>認証に失敗しました</AlertTitle>
                <AlertDescription>パスワードが正しくありません。</AlertDescription>
              </Alert>
            ) : null}
            <Button type="submit" className="w-full">
              ログイン
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

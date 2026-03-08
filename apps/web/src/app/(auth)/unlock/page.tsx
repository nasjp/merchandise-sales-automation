import { normalizeNextPath } from "@/server/uiPasswordGate";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
          <CardDescription>
            UI へアクセスするためにパスワードを入力してください。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action="/api/ui-auth" method="post" className="grid gap-4">
            <input type="hidden" name="next" value={next} />
            <div className="grid gap-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input id="password" type="password" name="password" required autoFocus />
              <p className="text-xs text-muted-foreground">ログイン後の遷移先: {next}</p>
            </div>
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

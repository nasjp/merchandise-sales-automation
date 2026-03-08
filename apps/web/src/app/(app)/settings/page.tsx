import { PageScaffold } from "@/components/page/page-scaffold";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const settingItems = [
  "Android ingest endpoint / secret",
  "Trigger.dev project / API key",
  "Supabase connection / role",
];

export default function SettingsPage() {
  return (
    <PageScaffold
      title="Settings"
      description="運用設定の確認項目をここに集約します。"
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">設定項目</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            {settingItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </PageScaffold>
  );
}

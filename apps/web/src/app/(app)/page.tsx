import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageScaffold } from "@/components/page/page-scaffold";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { appNavItems } from "@/lib/navigation";

export default function HomePage() {
  return (
    <PageScaffold
      title="Dashboard"
      description="レビューと運用に必要な画面へすぐ移動できます。"
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {appNavItems
          .filter((item) => item.href !== "/")
          .map((item) => {
            const Icon = item.icon;

            return (
              <Card key={item.href} className="border-border/80 bg-card/90">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Icon className="h-5 w-5 text-primary" />
                    {item.label}
                  </CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {item.label} 画面へ移動して、最新データを確認します。
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full">
                    <Link href={item.href}>
                      開く
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
      </section>
    </PageScaffold>
  );
}

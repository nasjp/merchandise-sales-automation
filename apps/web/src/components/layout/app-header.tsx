import Link from "next/link";
import { AppNav } from "@/components/layout/app-nav";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <AppNav />
          <Link href="/" className="text-sm font-semibold tracking-tight sm:text-base">
            Merchandise Sales Automation
          </Link>
        </div>

        <form action="/api/ui-auth/logout" method="post">
          <Button type="submit" size="sm" variant="outline">
            ログアウト
          </Button>
        </form>
      </div>
    </header>
  );
}

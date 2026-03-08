"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { appNavItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const isActivePath = (pathname: string, href: string) => {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
};

export function AppNav() {
  const pathname = usePathname();

  return (
    <>
      <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
        {appNavItems.map((item) => {
          const active = isActivePath(pathname, item.href);
          return (
            <Button
              key={item.href}
              variant={active ? "secondary" : "ghost"}
              size="sm"
              asChild
              className={cn(active ? "font-semibold" : "text-muted-foreground")}
            >
              <Link href={item.href} aria-current={active ? "page" : undefined}>
                {item.label}
              </Link>
            </Button>
          );
        })}
      </nav>

      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button type="button" variant="outline" size="icon" aria-label="メニューを開く">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="max-w-xs">
            <SheetHeader>
              <SheetTitle>Merchandise Sales</SheetTitle>
              <SheetDescription>画面を選択してください</SheetDescription>
            </SheetHeader>
            <nav className="mt-8 grid gap-2" aria-label="Mobile Primary">
              {appNavItems.map((item) => {
                const active = isActivePath(pathname, item.href);
                const Icon = item.icon;

                return (
                  <Button
                    key={item.href}
                    variant={active ? "secondary" : "ghost"}
                    asChild
                    className="h-auto justify-start px-3 py-3"
                  >
                    <Link href={item.href} aria-current={active ? "page" : undefined}>
                      <span className="mr-2 inline-flex items-center">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="text-left">
                        <span className="block text-sm font-medium">{item.label}</span>
                        <span className="block text-xs text-muted-foreground">{item.description}</span>
                      </span>
                    </Link>
                  </Button>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

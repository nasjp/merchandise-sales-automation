import type { LucideIcon } from "lucide-react";
import { Gauge, ListChecks, Radar, PackageSearch, Database, Settings } from "lucide-react";

export type AppNavItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

export const appNavItems: AppNavItem[] = [
  {
    href: "/",
    label: "Dashboard",
    description: "主要画面のハブ",
    icon: Gauge,
  },
  {
    href: "/candidates",
    label: "Candidates",
    description: "レビュー候補を確認",
    icon: ListChecks,
  },
  {
    href: "/targets",
    label: "Targets",
    description: "監視ターゲットの一覧",
    icon: Radar,
  },
  {
    href: "/price-snapshots",
    label: "Price Snapshots",
    description: "相場スナップショット",
    icon: PackageSearch,
  },
  {
    href: "/runs",
    label: "Runs",
    description: "ジョブ実行履歴",
    icon: Database,
  },
  {
    href: "/raw-events",
    label: "Raw Events",
    description: "受信イベントの生ログ",
    icon: Database,
  },
  {
    href: "/settings",
    label: "Settings",
    description: "運用ヘルスとRunbook",
    icon: Settings,
  },
];

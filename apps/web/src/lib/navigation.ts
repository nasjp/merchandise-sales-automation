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
    description: "主要画面への入口",
    icon: Gauge,
  },
  {
    href: "/candidates",
    label: "Candidates",
    description: "候補を確認して承認・却下",
    icon: ListChecks,
  },
  {
    href: "/targets",
    label: "Targets",
    description: "監視対象と相場データ",
    icon: Radar,
  },
  {
    href: "/price-snapshots",
    label: "Price Snapshots",
    description: "相場データの履歴",
    icon: PackageSearch,
  },
  {
    href: "/runs",
    label: "Runs",
    description: "ジョブの実行履歴",
    icon: Database,
  },
  {
    href: "/raw-events",
    label: "Raw Events",
    description: "受信イベントのログ",
    icon: Database,
  },
  {
    href: "/settings",
    label: "Settings",
    description: "運用状況と対応手順",
    icon: Settings,
  },
];

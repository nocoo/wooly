"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  CalendarCheck,
  TrendingUp,
  BarChart3,
  Ticket,
  ClipboardList,
  Plus,
  Zap,
  Undo2,
} from "lucide-react";
import { PageHeader } from "@nocoo/basalt/components/page-header";
import { SectionRule } from "@nocoo/basalt/components/section-rule";
import { Button, LayerCard, Meter, toast } from "@nocoo/basalt";
import { useTrackerViewModel } from "@/viewmodels/useTrackerViewModel";
import { StatCardWidget, StatGrid } from "@/components/dashboard/StatCardWidget";
import { RecentListCard } from "@/components/dashboard/RecentListCard";
import type { RecentListItem } from "@/components/dashboard/RecentListCard";
import { ActionGridCard } from "@/components/dashboard/ActionGridCard";
import type { ActionItem } from "@/components/dashboard/ActionGridCard";
import { RedeemDialog } from "@/components/RedeemDialog";
import type { RedeemDialogMember } from "@/components/RedeemDialog";
import { BenefitStatusBadge } from "@/components/BenefitStatusBadge";
import { TrackerSkeleton } from "@/components/TrackerSkeleton";

export default function TrackerPage() {
  const router = useRouter();
  const vm = useTrackerViewModel();

  const [redeemTarget, setRedeemTarget] = useState<{
    benefitId: string;
    benefitName: string;
    sourceName: string;
    sourceMemberId: string;
    type: "quota" | "credit" | "action";
    statusLabel: string;
  } | null>(null);

  // Map StatCard[] icons
  const statIcons = [CalendarCheck, TrendingUp, BarChart3];

  // Map RedemptionLogItem[] → RecentListItem[]
  const logItems: RecentListItem[] = vm.recentRedemptions.slice(0, 10).map((r) => ({
    id: r.id,
    label: `${r.benefitName} · ${r.memberName}`,
    sublabel: `${r.redeemedAt.slice(0, 10)} · ${r.sourceName}`,
    icon: CheckCircle,
    iconClassName: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
    rightText: r.memo ?? undefined,
  }));

  // Quick actions
  const quickActions: ActionItem[] = [
    {
      icon: Ticket,
      label: "核销",
      colorClassName: "bg-basalt-primary/10 text-basalt-primary",
      onClick: () => {
        document.getElementById("redeemable-list")?.scrollIntoView({ behavior: "smooth" });
      },
    },
    {
      icon: ClipboardList,
      label: "查看账户",
      colorClassName: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
      onClick: () => router.push("/sources"),
    },
    {
      icon: Plus,
      label: "添加账户",
      colorClassName: "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
      onClick: () => router.push("/sources"),
    },
    {
      icon: Zap,
      label: "仪表盘",
      colorClassName: "bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400",
      onClick: () => router.push("/"),
    },
  ];

  // Map members → RedeemDialogMember[]
  const redeemMembers: RedeemDialogMember[] = vm.members.map((m) => ({
    id: m.id,
    name: m.name,
  }));

  const handleRedeem = (memberId: string, memo?: string) => {
    if (redeemTarget) {
      vm.redeem(redeemTarget.benefitId, memberId, memo);
      toast.success(`已核销：${redeemTarget.benefitName}`);
      setRedeemTarget(null);
    }
  };

  const handleUndo = (redemptionId: string, benefitName: string) => {
    vm.undoRedemption(redemptionId);
    toast.success(`已撤销：${benefitName}`);
  };

  if (vm.loading) {
    return <TrackerSkeleton />;
  }

  // Page-root visual state — see docs/07-ui-design-audit.md §3.5.3.
  const visualState =
    vm.recentRedemptions.length === 0 && vm.redeemableBenefits.length === 0
      ? "empty"
      : "normal";

  return (
    <div className="space-y-6 md:space-y-8" data-visual-state={visualState}>
      <PageHeader
        title="核销台"
        description="快速核销权益、记录核销历史与撤销误操作"
      />

      {/* ── 统计 ─────────────────────────────────────── */}
      <SectionRule title="统计" hint="家庭权益核销总数与当期进度">
        <StatGrid columns={3}>
          {vm.stats.map((stat, i) => (
            <StatCardWidget
              key={stat.label}
              title={stat.label}
              value={stat.value}
              icon={statIcons[i]}
              variant={i === 0 ? "primary" : "secondary"}
              accentColor={i === 0 ? undefined : i === 1 ? "bg-basalt-chart-3" : "bg-basalt-chart-5"}
            />
          ))}
        </StatGrid>
      </SectionRule>

      {/* ── 日志 ─────────────────────────────────────── */}
      <SectionRule title="日志" hint="最近核销流水与快捷入口">
        <div className="grid gap-4 md:gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <RecentListCard
              title="核销日志"
              icon={ClipboardList}
              items={logItems}
              emptyText="暂无核销记录"
            />
            {/* Undo buttons for recent redemptions */}
            {vm.recentRedemptions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {vm.recentRedemptions.slice(0, 3).map((r) => (
                  <Button
                    key={r.id}
                    variant="ghost"
                    size="sm"
                    className="text-xs text-basalt-muted-foreground"
                    onClick={() => handleUndo(r.id, r.benefitName)}
                    icon={<Undo2 className="h-3 w-3" />}
                  >
                    撤销「{r.benefitName}」
                  </Button>
                ))}
              </div>
            )}
          </div>
          <div className="md:col-span-1">
            <ActionGridCard
              title="快捷操作"
              icon={Zap}
              actions={quickActions}
            />
          </div>
        </div>
      </SectionRule>

      {/* ── 可核销 ───────────────────────────────────── */}
      <SectionRule title="可核销" hint="当前周期内可供核销的全部权益">
        <div id="redeemable-list" className="space-y-3">
          {vm.redeemableBenefits.length === 0 ? (
            <LayerCard className="p-6 text-center text-sm text-basalt-muted-foreground">
              暂无可核销的权益
            </LayerCard>
          ) : (
            vm.redeemableBenefits.map((item) => (
              <LayerCard.Well
                key={item.id}
                className="p-3 md:p-4 rounded-basalt-card"
              >
                {/* Header: name + source + status badge + redeem button */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-sm font-medium text-basalt-foreground truncate">
                      {item.benefitName}
                    </span>
                    <span className="text-xs text-basalt-muted-foreground shrink-0">
                      {item.sourceName}
                    </span>
                    <BenefitStatusBadge
                      status={item.isExpiringSoon ? "expiring_soon" : "available"}
                    />
                  </div>
                  <div className="flex items-center gap-2 ml-2 shrink-0">
                    {item.isExpiringSoon && (
                      <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                        {item.daysUntilEnd}天后过期
                      </span>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2.5 text-xs text-basalt-primary hover:text-basalt-primary"
                      onClick={() =>
                        setRedeemTarget({
                          benefitId: item.id,
                          benefitName: item.benefitName,
                          sourceName: item.sourceName,
                          sourceMemberId: item.sourceMemberId,
                          type: item.type,
                          statusLabel: item.statusLabel,
                        })
                      }
                      icon={<CheckCircle className="h-3.5 w-3.5" />}
                    >
                      核销
                    </Button>
                  </div>
                </div>

                {/* Progress / Status display */}
                <div className="mt-2">
                  {item.type === "action" ? (
                    <div className="flex items-center justify-between text-xs text-basalt-muted-foreground py-1 bg-basalt-bright rounded-lg px-2.5 border border-basalt-border/40">
                      <span>任务提醒</span>
                      <span className="font-medium text-basalt-foreground">{item.statusLabel}</span>
                    </div>
                  ) : (
                    <Meter
                      value={Math.round(item.progressPercent)}
                      label={item.type === "quota" ? "次数型" : "额度型"}
                      customValue={item.statusLabel}
                      aria-label={`${item.benefitName} 使用进度`}
                      className={
                        item.isExpiringSoon
                          ? "[--basalt-primary:var(--basalt-warning)]"
                          : undefined
                      }
                    />
                  )}
                </div>
              </LayerCard.Well>
            ))
          )}
        </div>
      </SectionRule>

      {/* Redeem Dialog */}
      {redeemTarget && (
        <RedeemDialog
          open={!!redeemTarget}
          onOpenChange={(open) => {
            if (!open) setRedeemTarget(null);
          }}
          benefitName={redeemTarget.benefitName}
          sourceName={redeemTarget.sourceName}
          benefitType={redeemTarget.type}
          statusLabel={redeemTarget.statusLabel}
          defaultMemberId={redeemTarget.sourceMemberId}
          members={redeemMembers}
          onConfirm={handleRedeem}
        />
      )}
    </div>
  );
}

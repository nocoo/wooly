"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Wallet,
  Package,
  Coins,
  Plus,
  Archive,
  ChevronDown,
  ChevronRight,
  PieChart,
  Activity,
  Bell,
} from "lucide-react";
import { PageHeader } from "@nocoo/basalt/components/page-header";
import { SectionRule } from "@nocoo/basalt/components/section-rule";
import { Button, LayerCard } from "@nocoo/basalt";
import { useSourcesViewModel } from "@/viewmodels/useSourcesViewModel";
import { StatCardWidget, StatGrid } from "@/components/dashboard/StatCardWidget";
import { MemberFilterBar } from "@/components/MemberFilterBar";
import type { MemberFilterOption } from "@/components/MemberFilterBar";
import { SourceCard } from "@/components/SourceCard";
import { PointsSourceCard } from "@/components/PointsSourceCard";
import { SourcesSkeleton } from "@/components/SourcesSkeleton";
import { SourceFormDialog } from "@/components/SourceFormDialog";
import type { SourceFormMember } from "@/components/SourceFormDialog";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { RadialProgressCard } from "@/components/dashboard/RadialProgressCard";
import { BarChartCard } from "@/components/dashboard/BarChartCard";
import { ItemListCard } from "@/components/dashboard/ItemListCard";
import { chart } from "@/lib/palette";

export default function SourcesPage() {
  const router = useRouter();
  const vm = useSourcesViewModel();

  const [archiveOpen, setArchiveOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  // Map MemberOption → MemberFilterOption
  const filterMembers: MemberFilterOption[] = vm.members.map((m) => ({
    id: m.id,
    label: m.name,
  }));

  // Map MemberOption → SourceFormMember
  const formMembers: SourceFormMember[] = vm.members.map((m) => ({
    id: m.id,
    name: m.name,
  }));

  const statIcons = [Wallet, Package, Coins];

  const handleNewSource = () => {
    vm.startNewSource();
  };

  const handleFormSubmit = () => {
    if (vm.editingSource) {
      vm.handleUpdateSource();
    } else {
      vm.handleCreateSource();
    }
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      vm.handleDeleteSource(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  if (vm.loading) {
    return <SourcesSkeleton />;
  }

  // Page-root visual state — see docs/07-ui-design-audit.md §3.5.3.
  const visualState =
    vm.sourceCards.length === 0 && vm.pointsSourceCards.length === 0
      ? "empty"
      : "normal";

  return (
    <div className="space-y-6 md:space-y-8" data-visual-state={visualState}>
      <PageHeader
        title="权益账户"
        description="管理家庭银行卡、保险会员及积分账户资产"
        actions={
          <div className="flex items-center gap-2">
            <MemberFilterBar
              members={filterMembers}
              selectedId={vm.selectedMember}
              onSelect={vm.setSelectedMember}
            />
            <Button
              onClick={handleNewSource}
              size="sm"
              className="shrink-0"
              icon={<Plus className="h-4 w-4" />}
            >
              添加账户
            </Button>
          </div>
        }
      />

      {/* ── 账户 ─────────────────────────────────────── */}
      <SectionRule title="账户" hint="已绑定的有效权益与积分账户">
        {vm.sourceCards.length === 0 && vm.pointsSourceCards.length === 0 ? (
          <LayerCard className="p-8 text-center text-basalt-muted-foreground">
            暂无账户数据
          </LayerCard>
        ) : (
          <div className="grid gap-4 md:gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 min-[1920px]:grid-cols-8 justify-items-stretch">
            {vm.sourceCards.map((card) => (
              <SourceCard
                key={card.id}
                id={card.id}
                name={card.name}
                memberName={card.memberName}
                category={card.category}
                categoryLabel={card.categoryLabel}
                icon={card.icon}
                phone={card.phone}
                currency={card.currency}
                isExpired={card.isExpired}
                isExpiringSoon={card.isExpiringSoon}
                validUntilLabel={card.validUntilLabel}
                usedCount={card.usedCount}
                totalCount={card.totalCount}
                benefitCount={card.benefitCount}
                nextResetLabel={card.nextResetLabel}
                archived={card.archived}
                costLabel={card.cost}
                cardNumber={card.cardNumber}
                colorIndex={card.colorIndex}
                cardNetwork={card.cardNetwork}
                onClick={() => router.push(`/sources/${card.id}`)}
                onEdit={() => vm.startEditSource(card.id)}
                onToggleArchive={() => vm.handleToggleArchive(card.id)}
                onDelete={() => setDeleteTarget({ id: card.id, name: card.name })}
              />
            ))}
            {vm.pointsSourceCards.map((card) => (
              <PointsSourceCard
                key={card.id}
                id={card.id}
                name={card.name}
                memberName={card.memberName}
                balance={card.balance}
                affordableCount={card.affordableCount}
                totalRedeemables={card.redeemableCount}
                onClick={() => router.push(`/sources/points-${card.id}`)}
                className="cursor-pointer"
              />
            ))}
          </div>
        )}
      </SectionRule>

      {/* ── 统计 ─────────────────────────────────────── */}
      <SectionRule title="统计" hint="当前账户总览及额度汇总">
        <StatGrid columns={3}>
          {vm.stats.map((stat, i) => (
            <StatCardWidget
              key={stat.label}
              title={stat.label}
              value={stat.value}
              icon={statIcons[i]}
              variant={i === 0 ? "primary" : "secondary"}
            />
          ))}
        </StatGrid>
      </SectionRule>

      {/* ── 分布 ─────────────────────────────────────── */}
      <SectionRule title="分布" hint="额度使用率与类型分布">
        <div className="grid gap-4 md:gap-6 md:grid-cols-3">
          <RadialProgressCard
            title="当期额度使用率"
            icon={Activity}
            percentage={vm.usageSummary.percent}
            segments={[
              { label: "已用", value: String(vm.usageSummary.usedCount) },
              { label: "总额", value: String(vm.usageSummary.totalCount) },
              { label: "剩余", value: String(vm.usageSummary.remainingCount) },
            ]}
            fillColor={chart.primary}
          />
          <BarChartCard
            title="账户类型分布"
            icon={PieChart}
            data={vm.categoryChart.map((item) => ({
              name: item.name,
              value: item.value,
            }))}
            barColor={chart.purple}
            yAxisFormatter={(value) => `${value}`}
          />
          <ItemListCard
            title="到期提醒"
            icon={Bell}
            items={vm.expiringAlerts.map((item) => ({
              id: item.id,
              label: item.label,
              value: item.value,
              valueClassName:
                item.tone === "expired" ? "text-basalt-destructive" : "text-basalt-warning",
            }))}
            emptyText="暂无到期提醒"
          />
        </div>
      </SectionRule>

      {/* ── 归档 ─────────────────────────────────────── */}
      {vm.archivedSourceCards.length > 0 && (
        <SectionRule title="归档" hint="已归档的过期或闲置账户">
          <LayerCard className="p-3 md:p-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setArchiveOpen(!archiveOpen)}
              className="flex w-full items-center justify-start gap-2 text-sm text-basalt-muted-foreground hover:text-basalt-foreground transition-colors p-0 h-auto"
            >
              {archiveOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <Archive className="h-4 w-4" />
              <span>已归档 ({vm.archivedSourceCards.length})</span>
            </Button>
            {archiveOpen && (
              <div className="mt-3 grid gap-4 md:gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 min-[1920px]:grid-cols-8 justify-items-stretch">
                {vm.archivedSourceCards.map((card) => (
                  <SourceCard
                    key={card.id}
                    id={card.id}
                    name={card.name}
                    memberName={card.memberName}
                    category={card.category}
                    categoryLabel={card.categoryLabel}
                    icon={card.icon}
                    phone={card.phone}
                    currency={card.currency}
                    isExpired={card.isExpired}
                    isExpiringSoon={card.isExpiringSoon}
                    validUntilLabel={card.validUntilLabel}
                    usedCount={card.usedCount}
                    totalCount={card.totalCount}
                    benefitCount={card.benefitCount}
                    nextResetLabel={card.nextResetLabel}
                    archived={card.archived}
                    costLabel={card.cost}
                    cardNumber={card.cardNumber}
                    colorIndex={card.colorIndex}
                    cardNetwork={card.cardNetwork}
                    onClick={() => router.push(`/sources/${card.id}`)}
                    onEdit={() => vm.startEditSource(card.id)}
                    onToggleArchive={() => vm.handleToggleArchive(card.id)}
                    onDelete={() => setDeleteTarget({ id: card.id, name: card.name })}
                  />
                ))}
              </div>
            )}
          </LayerCard>
        </SectionRule>
      )}

      {/* Source Form Dialog */}
      <SourceFormDialog
        open={vm.formOpen}
        onOpenChange={vm.setFormOpen}
        editing={!!vm.editingSource}
        formInput={vm.formInput}
        onFormInputChange={vm.setFormInput}
        errors={vm.formErrors}
        members={formMembers}
        onSubmit={handleFormSubmit}
      />

      {/* Delete Confirm Dialog */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="删除账户"
        description={`确定要删除账户「${deleteTarget?.name}」吗？此操作将同时删除该账户下的所有权益和核销记录，且无法撤销。`}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

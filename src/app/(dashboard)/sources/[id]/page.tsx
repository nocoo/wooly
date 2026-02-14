"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Package,
  AlertTriangle,
  CheckCircle,
  Users,
  Phone,
  Globe,
  Calendar,
  Plus,
  ArrowLeft,
  Coins,
  Pencil,
  Trash2,
  DollarSign,
} from "lucide-react";
import { useSourceDetailViewModel } from "@/viewmodels/useSourceDetailViewModel";
import { usePointsDetailViewModel } from "@/viewmodels/usePointsDetailViewModel";
import { COST_CYCLE_LABELS } from "@/models/source";
import { StatCardWidget, StatGrid } from "@/components/dashboard/StatCardWidget";
import { BenefitProgressRow } from "@/components/dashboard/BenefitProgressRow";
import { ItemListCard } from "@/components/dashboard/ItemListCard";
import type { ListItem } from "@/components/dashboard/ItemListCard";
import { BenefitFormDialog } from "@/components/BenefitFormDialog";
import { RedeemableFormDialog } from "@/components/RedeemableFormDialog";
import { RedeemDialog } from "@/components/RedeemDialog";
import type { RedeemDialogMember } from "@/components/RedeemDialog";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Image from "next/image";

// ---------------------------------------------------------------------------
// Helper: detect points source ID
// ---------------------------------------------------------------------------

function isPointsSourceId(id: string): boolean {
  return id.startsWith("points-");
}

function extractPointsSourceId(id: string): string {
  return id.replace(/^points-/, "");
}

// ---------------------------------------------------------------------------
// Points Source Detail View
// ---------------------------------------------------------------------------

function PointsDetailView({ pointsSourceId }: { pointsSourceId: string }) {
  const router = useRouter();
  const vm = usePointsDetailViewModel(pointsSourceId);

  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  if (!vm.header) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="text-lg">积分账户不存在</p>
        <Button
          variant="ghost"
          onClick={() => router.push("/sources")}
          className="mt-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          返回账户列表
        </Button>
      </div>
    );
  }

  const { header } = vm;

  const statIcons = [Coins, Package, CheckCircle];

  const handleFormSubmit = () => {
    if (vm.editingRedeemableId) {
      vm.handleUpdateRedeemable();
    } else {
      vm.handleCreateRedeemable();
    }
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      vm.handleDeleteRedeemable(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/sources")}
        className="text-muted-foreground -ml-2"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        账户列表
      </Button>

      {/* Header card */}
      <div className="rounded-card bg-secondary p-4 md:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 shrink-0">
            <Coins className="h-5 w-5 text-amber-600" strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-foreground">
              {header.name}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {header.memberName} · 积分
            </p>
            <p className="text-2xl font-semibold text-foreground font-display tracking-tight mt-3">
              {header.balance.toLocaleString()}
              <span className="text-sm font-normal text-muted-foreground ml-1.5">
                积分
              </span>
            </p>
            {header.memo && (
              <p className="text-xs text-muted-foreground mt-2">
                {header.memo}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <StatGrid columns={3}>
        {vm.stats.map((stat, i) => (
          <StatCardWidget
            key={stat.label}
            title={stat.label}
            value={stat.value.toLocaleString()}
            icon={statIcons[i]}
          />
        ))}
      </StatGrid>

      {/* Redeemable items list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">可兑换项目</h3>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => vm.setRedeemableFormOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            添加兑换项
          </Button>
        </div>

        {vm.redeemableRows.length === 0 ? (
          <div className="rounded-widget bg-secondary p-6 text-center text-sm text-muted-foreground">
            暂无可兑换项
          </div>
        ) : (
          <div className="space-y-2">
            {vm.redeemableRows.map((row) => (
              <div
                key={row.id}
                className={cn(
                  "rounded-widget bg-secondary p-4 flex items-center justify-between gap-3",
                  !row.affordable && "opacity-50",
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">
                      {row.name}
                    </p>
                    {row.affordable ? (
                      <Badge
                        variant="outline"
                        className="text-xs text-emerald-600 border-emerald-600 shrink-0"
                      >
                        可兑换
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-xs text-muted-foreground shrink-0"
                      >
                        积分不足
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {row.cost.toLocaleString()} 积分
                    {row.memo && ` · ${row.memo}`}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => vm.startEditRedeemable(row.id)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() =>
                      setDeleteTarget({ id: row.id, name: row.name })
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Redeemable Form Dialog */}
      <RedeemableFormDialog
        open={vm.redeemableFormOpen}
        onOpenChange={vm.setRedeemableFormOpen}
        editing={!!vm.editingRedeemableId}
        formInput={vm.redeemableFormInput}
        onFormInputChange={vm.setRedeemableFormInput}
        errors={vm.redeemableFormErrors}
        onSubmit={handleFormSubmit}
      />

      {/* Delete Confirm Dialog */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="删除可兑换项"
        description={`确定要删除「${deleteTarget?.name ?? ""}」吗？该操作不可撤销。`}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Regular Source Detail View
// ---------------------------------------------------------------------------

function RegularSourceDetailView({ sourceId }: { sourceId: string }) {
  const router = useRouter();
  const vm = useSourceDetailViewModel(sourceId);

  const [redeemTarget, setRedeemTarget] = useState<{
    benefitId: string;
    benefitName: string;
    type: "quota" | "credit" | "action";
    statusLabel: string;
  } | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  if (!vm.source) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="text-lg">账户不存在</p>
        <Button
          variant="ghost"
          onClick={() => router.push("/sources")}
          className="mt-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          返回账户列表
        </Button>
      </div>
    );
  }

  const { source } = vm;

  // Map memberUsage → ListItem[]
  const memberUsageItems: ListItem[] = vm.memberUsage.map((mu) => ({
    id: mu.memberId,
    label: mu.memberName,
    value: `${mu.count}次`,
  }));

  // Map members → RedeemDialogMember[]
  const redeemMembers: RedeemDialogMember[] = vm.members.map((m) => ({
    id: m.id,
    name: m.name,
  }));

  const statIcons = [Package, CheckCircle, AlertTriangle];

  const handleFormSubmit = () => {
    if (vm.editingBenefitId) {
      vm.handleUpdateBenefit();
    } else {
      vm.handleCreateBenefit();
    }
  };

  const handleRedeem = (memberId: string, memo?: string) => {
    if (redeemTarget) {
      vm.redeem(redeemTarget.benefitId, memberId, memo);
      setRedeemTarget(null);
    }
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      vm.handleDeleteBenefit(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/sources")}
        className="text-muted-foreground -ml-2"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        账户列表
      </Button>

      {/* Row 1: Source header card */}
      <div className="rounded-card bg-secondary p-4 md:p-6">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="shrink-0">
            {source.icon.type === "favicon" ? (
              <Image
                src={`https://favicon.im/${source.icon.value}`}
                alt={source.name}
                width={40}
                height={40}
                className="rounded-lg"
                unoptimized
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-card text-xl">
                {source.icon.value}
              </div>
            )}
          </div>

          {/* Main info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-semibold text-foreground">
                {source.name}
              </h2>
              {source.isExpired && (
                <Badge variant="destructive" className="text-xs">已过期</Badge>
              )}
              {source.isExpiringSoon && !source.isExpired && (
                <Badge variant="outline" className="text-xs text-amber-600 border-amber-600">
                  即将到期
                </Badge>
              )}
              {source.archived && (
                <Badge variant="secondary" className="text-xs">已归档</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {source.memberName} · {source.categoryLabel} · {source.currency}
            </p>

            {/* Metadata */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
              {source.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {source.phone}
                </span>
              )}
              {source.websiteDomain && (
                <span className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  {source.websiteDomain}
                </span>
              )}
              {source.cost !== null && source.costCycle !== null && (
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {source.currency} {source.cost.toLocaleString()}/{COST_CYCLE_LABELS[source.costCycle]}
                </span>
              )}
              {(source.validFromLabel || source.validUntilLabel) && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {source.validFromLabel ?? "?"} ~ {source.validUntilLabel ?? "?"}
                </span>
              )}
            </div>

            {/* Overall progress */}
            <div className="mt-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 rounded-full bg-card">
                  <div
                    className={cn(
                      "h-full rounded-full bg-primary transition-all",
                    )}
                    style={{ width: `${Math.min(source.overallUsagePercent, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {source.overallUsagePercent}% 已使用
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {source.cycleLabel}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: StatGrid */}
      <StatGrid columns={3}>
        {vm.stats.map((stat, i) => (
          <StatCardWidget
            key={stat.label}
            title={stat.label}
            value={stat.value}
            icon={statIcons[i]}
          />
        ))}
      </StatGrid>

      {/* Row 3: Benefits list + Member usage (2:1) */}
      <div className="grid gap-4 md:gap-6 md:grid-cols-3">
        {/* Benefit progress list */}
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">权益列表</h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => vm.setBenefitFormOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              添加权益
            </Button>
          </div>
          {vm.benefitRows.length === 0 ? (
            <div className="rounded-widget bg-secondary p-6 text-center text-sm text-muted-foreground">
              暂无权益
            </div>
          ) : (
            vm.benefitRows.map((row) => (
              <BenefitProgressRow
                key={row.id}
                id={row.id}
                name={row.name}
                type={row.type}
                status={row.status}
                statusLabel={row.statusLabel}
                statusSeverity={row.statusSeverity}
                progressPercent={row.progressPercent}
                isExpiringSoon={row.isExpiringSoon}
                expiryWarning={row.expiryWarning}
                shared={row.shared}
                onRedeem={() =>
                  setRedeemTarget({
                    benefitId: row.id,
                    benefitName: row.name,
                    type: row.type,
                    statusLabel: row.statusLabel,
                  })
                }
                onEdit={() => vm.startEditBenefit(row.id)}
                onDelete={() => setDeleteTarget({ id: row.id, name: row.name })}
              />
            ))
          )}
        </div>

        {/* Member usage */}
        <div className="md:col-span-1">
          <ItemListCard
            title="受益人使用统计"
            icon={Users}
            items={memberUsageItems}
            emptyText="暂无核销记录"
          />
        </div>
      </div>

      {/* Benefit Form Dialog */}
      <BenefitFormDialog
        open={vm.benefitFormOpen}
        onOpenChange={vm.setBenefitFormOpen}
        editing={!!vm.editingBenefitId}
        formInput={vm.benefitFormInput}
        onFormInputChange={vm.setBenefitFormInput}
        errors={vm.benefitFormErrors}
        onSubmit={handleFormSubmit}
      />

      {/* Redeem Dialog */}
      {redeemTarget && (
        <RedeemDialog
          open={!!redeemTarget}
          onOpenChange={(open) => {
            if (!open) setRedeemTarget(null);
          }}
          benefitName={redeemTarget.benefitName}
          sourceName={source.name}
          benefitType={redeemTarget.type}
          statusLabel={redeemTarget.statusLabel}
          defaultMemberId={source.memberId}
          members={redeemMembers}
          onConfirm={handleRedeem}
        />
      )}

      {/* Delete Confirm Dialog */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="删除权益"
        description={`确定要删除「${deleteTarget?.name ?? ""}」吗？该操作不可撤销，所有关联的核销记录将一并删除。`}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page Component (Router)
// ---------------------------------------------------------------------------

export default function SourceDetailPage() {
  const params = useParams();
  const id = params.id as string;

  if (isPointsSourceId(id)) {
    return <PointsDetailView pointsSourceId={extractPointsSourceId(id)} />;
  }

  return <RegularSourceDetailView sourceId={id} />;
}

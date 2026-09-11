"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
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
  CreditCard,
} from "lucide-react";
import { PageHeader } from "@nocoo/basalt/components/page-header";
import { SectionRule } from "@nocoo/basalt/components/section-rule";
import { Button, Badge, LayerCard, Meter } from "@nocoo/basalt";
import { useSourceDetailViewModel } from "@/viewmodels/useSourceDetailViewModel";
import { usePointsDetailViewModel } from "@/viewmodels/usePointsDetailViewModel";
import { StatCardWidget, StatGrid } from "@/components/dashboard/StatCardWidget";
import { BenefitProgressRow } from "@/components/dashboard/BenefitProgressRow";
import { ItemListCard } from "@/components/dashboard/ItemListCard";
import { SourceDetailSkeleton } from "@/components/SourceDetailSkeleton";
import { CATEGORY_ICONS } from "@/components/icons/source-category";
import {
  CARD_NETWORK_LOGOS,
  type CardNetwork,
} from "@/components/icons/card-network";
import type { ListItem } from "@/components/dashboard/ItemListCard";
import { BenefitFormDialog } from "@/components/BenefitFormDialog";
import { RedeemableFormDialog } from "@/components/RedeemableFormDialog";
import { RedeemDialog } from "@/components/RedeemDialog";
import type { RedeemDialogMember } from "@/components/RedeemDialog";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { cn } from "@/lib/utils";

function CategoryIconBadge({ iconValue }: { iconValue: string }) {
  const Icon = CATEGORY_ICONS[iconValue] ?? CATEGORY_ICONS.other;
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-basalt-background text-basalt-muted-foreground">
      <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
    </div>
  );
}

function NetworkLogoInline({ cardNetwork }: { cardNetwork: CardNetwork }) {
  const NetworkLogo = CARD_NETWORK_LOGOS[cardNetwork];
  return (
    <NetworkLogo
      className="h-5 w-auto"
      aria-label={`${cardNetwork} card network`}
    />
  );
}

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

  if (vm.loading) {
    return <SourceDetailSkeleton variant="points" />;
  }

  if (!vm.header) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-basalt-muted-foreground">
        <p className="text-lg">积分账户不存在</p>
        <Button
          variant="ghost"
          onClick={() => router.push("/sources")}
          className="mt-4"
          icon={<ArrowLeft className="h-4 w-4" />}
        >
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
    <div className="space-y-6 md:space-y-8">
      <PageHeader
        title={header.name}
        description={`${header.memberName} · 积分账户 · 余额 ${header.balance.toLocaleString()} 积分`}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/sources")}
            icon={<ArrowLeft className="h-4 w-4" />}
          >
            返回列表
          </Button>
        }
      />

      {/* Header card */}
      <LayerCard className="p-4 md:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 shrink-0">
            <Coins className="h-5 w-5 text-amber-600" strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-basalt-foreground">
              {header.name}
            </h2>
            <p className="text-sm text-basalt-muted-foreground mt-1">
              {header.memberName} · 积分
            </p>
            <p className="text-2xl font-semibold text-basalt-foreground font-display tracking-tight tabular-nums mt-3">
              {header.balance.toLocaleString()}
              <span className="text-sm font-normal text-basalt-muted-foreground ml-1.5">
                积分
              </span>
            </p>
            {header.memo && (
              <p className="text-xs text-basalt-muted-foreground mt-2">
                {header.memo}
              </p>
            )}
          </div>
        </div>
      </LayerCard>

      {/* Stats */}
      <SectionRule title="统计" hint="当前积分与可兑换项目汇总">
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
      </SectionRule>

      {/* Redeemable items list */}
      <SectionRule
        title="可兑换项目"
        hint="积分可兑换的项目清单"
        actions={
          <Button
            size="sm"
            onClick={() => vm.startNewRedeemable()}
            icon={<Plus className="h-4 w-4" />}
          >
            添加兑换项
          </Button>
        }
      >
        {vm.redeemableRows.length === 0 ? (
          <LayerCard className="p-6 text-center text-sm text-basalt-muted-foreground">
            暂无可兑换项
          </LayerCard>
        ) : (
          <div className="space-y-2">
            {vm.redeemableRows.map((row) => (
              <LayerCard.Well
                key={row.id}
                className={cn(
                  "p-4 rounded-card flex items-center justify-between gap-3",
                  !row.affordable && "opacity-50",
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-basalt-foreground truncate">
                      {row.name}
                    </p>
                    {row.affordable ? (
                      <Badge variant="success" className="text-xs">
                        可兑换
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        积分不足
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-basalt-muted-foreground mt-1">
                    所需积分：{row.cost.toLocaleString()}
                  </p>
                  {row.memo && (
                    <p className="text-xs text-basalt-muted-foreground/80 mt-0.5">
                      {row.memo}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-basalt-muted-foreground hover:text-basalt-foreground"
                    onClick={() => vm.startEditRedeemable(row.id)}
                    aria-label="编辑兑换项"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-basalt-muted-foreground hover:text-basalt-destructive"
                    onClick={() =>
                      setDeleteTarget({ id: row.id, name: row.name })
                    }
                    aria-label="删除兑换项"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </LayerCard.Well>
            ))}
          </div>
        )}
      </SectionRule>

      {/* Dialogs */}
      <RedeemableFormDialog
        open={vm.redeemableFormOpen}
        onOpenChange={vm.setRedeemableFormOpen}
        editing={!!vm.editingRedeemableId}
        formInput={vm.redeemableFormInput}
        onFormInputChange={vm.setRedeemableFormInput}
        errors={vm.redeemableFormErrors}
        onSubmit={handleFormSubmit}
      />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="删除兑换项"
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

  if (vm.loading) {
    return <SourceDetailSkeleton variant="regular" />;
  }

  if (!vm.source) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-basalt-muted-foreground">
        <p className="text-lg">账户不存在</p>
        <Button
          variant="ghost"
          onClick={() => router.push("/sources")}
          className="mt-4"
          icon={<ArrowLeft className="h-4 w-4" />}
        >
          返回账户列表
        </Button>
      </div>
    );
  }

  const { source } = vm;

  const memberUsageItems: ListItem[] = vm.memberUsage.map((mu) => ({
    id: mu.memberId,
    label: mu.memberName,
    value: `${mu.count}次`,
  }));

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
    <div className="space-y-6 md:space-y-8">
      <PageHeader
        title={source.name}
        description={`${source.memberName} · ${source.categoryLabel} · ${source.currency} · 当期已使用 ${source.overallUsagePercent}%`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/sources")}
              icon={<ArrowLeft className="h-4 w-4" />}
            >
              返回列表
            </Button>
            <Button
              size="sm"
              onClick={() => vm.startNewBenefit()}
              icon={<Plus className="h-4 w-4" />}
            >
              添加权益
            </Button>
          </div>
        }
      />

      {/* Row 1: Source header card */}
      <LayerCard className="p-4 md:p-6">
        <div className="flex items-start gap-4">
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
            ) : source.icon.type === "category" ? (
              <CategoryIconBadge iconValue={source.icon.value} />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-basalt-background text-xl">
                {source.icon.value}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-semibold text-basalt-foreground">
                {source.name}
              </h2>
              {source.isExpired && (
                <Badge variant="destructive" className="text-xs">已过期</Badge>
              )}
              {source.isExpiringSoon && !source.isExpired && (
                <Badge variant="warning" className="text-xs">
                  即将到期
                </Badge>
              )}
              {source.archived && (
                <Badge variant="secondary" className="text-xs">已归档</Badge>
              )}
            </div>
            <p className="text-sm text-basalt-muted-foreground mt-1 flex items-center gap-2">
              <span>{source.memberName} · {source.categoryLabel} · {source.currency}</span>
              {source.cardNetwork && (
                <NetworkLogoInline cardNetwork={source.cardNetwork as CardNetwork} />
              )}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-basalt-muted-foreground mt-3">
              {source.cardNumber && (
                <span className="flex items-center gap-1 font-mono">
                  <CreditCard className="h-3.5 w-3.5" />
                  {source.cardNumber}
                </span>
              )}
              {source.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {source.phone}
                </span>
              )}
              {source.websiteDomain && (
                <span className="flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5" />
                  {source.websiteDomain}
                </span>
              )}
              {source.cost && (
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {source.cost}
                </span>
              )}
              {(source.validFromLabel || source.validUntilLabel) && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {source.validFromLabel ?? "?"} ~ {source.validUntilLabel ?? "?"}
                </span>
              )}
            </div>

            <div className="mt-3">
              <Meter
                value={source.overallUsagePercent}
                label="当期额度使用"
                customValue={`${source.overallUsagePercent}% 已使用`}
                aria-label="当期额度使用进度"
              />
              <p className="text-xs text-basalt-muted-foreground mt-1">
                {source.cycleLabel}
              </p>
            </div>
          </div>
        </div>
      </LayerCard>

      {/* Row 2: StatGrid */}
      <SectionRule title="统计" hint="当前账户权益总数与状态统计">
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
      </SectionRule>

      {/* Row 3: Benefits list + Member usage (2:1) */}
      <SectionRule title="权益明细" hint="各权益使用进度与家庭核销频次">
        <div className="grid gap-4 md:gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-4">
            {vm.benefitRows.length === 0 ? (
              <LayerCard className="p-6 text-center text-sm text-basalt-muted-foreground">
                暂无权益
              </LayerCard>
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
                  cycleLabel={row.cycleLabel}
                  shared={row.shared}
                  memo={row.memo}
                  onRedeem={
                    row.type !== "action"
                      ? () =>
                          setRedeemTarget({
                            benefitId: row.id,
                            benefitName: row.name,
                            type: row.type,
                            statusLabel: row.statusLabel,
                          })
                      : undefined
                  }
                  onEdit={() => vm.startEditBenefit(row.id)}
                  onDelete={() =>
                    setDeleteTarget({ id: row.id, name: row.name })
                  }
                />
              ))
            )}
          </div>

          <div className="md:col-span-1">
            <ItemListCard
              title="受益人使用统计"
              icon={Users}
              items={memberUsageItems}
              emptyText="暂无核销记录"
            />
          </div>
        </div>
      </SectionRule>

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

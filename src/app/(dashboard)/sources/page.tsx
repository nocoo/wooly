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
} from "lucide-react";
import { useSourcesViewModel } from "@/viewmodels/useSourcesViewModel";
import { StatCardWidget, StatGrid } from "@/components/dashboard/StatCardWidget";
import { MemberFilterBar } from "@/components/MemberFilterBar";
import type { MemberFilterOption } from "@/components/MemberFilterBar";
import { SourceCard } from "@/components/SourceCard";
import { PointsSourceCard } from "@/components/PointsSourceCard";
import { SourceFormDialog } from "@/components/SourceFormDialog";
import type { SourceFormMember } from "@/components/SourceFormDialog";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { Button } from "@/components/ui/button";

export default function SourcesPage() {
  const router = useRouter();
  const vm = useSourcesViewModel();

  const [archiveOpen, setArchiveOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  // Map MemberOption → MemberFilterOption
  const filterMembers: MemberFilterOption[] = [
    { id: null, label: "全部" },
    ...vm.members.map((m) => ({ id: m.id, label: m.name })),
  ];

  // Map MemberOption → SourceFormMember
  const formMembers: SourceFormMember[] = vm.members.map((m) => ({
    id: m.id,
    name: m.name,
  }));

  const statIcons = [Wallet, Package, Coins];

  const handleNewSource = () => {
    vm.setFormOpen(true);
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

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Row 1: StatGrid */}
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

      {/* Row 2: Member filter + Add button */}
      <div className="flex items-center justify-between gap-3">
        <MemberFilterBar
          members={filterMembers}
          selectedId={vm.selectedMember}
          onSelect={vm.setSelectedMember}
          className="flex-1"
        />
        <Button
          onClick={handleNewSource}
          size="sm"
          className="shrink-0"
        >
          <Plus className="h-4 w-4 mr-1" />
          新增来源
        </Button>
      </div>

      {/* Row 3: Source cards grid */}
      {vm.sourceCards.length === 0 && vm.pointsSourceCards.length === 0 && (
        <div className="rounded-widget bg-secondary p-8 text-center text-muted-foreground">
          暂无来源数据
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {vm.sourceCards.map((card) => (
          <SourceCard
            key={card.id}
            id={card.id}
            name={card.name}
            memberName={card.memberName}
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
            onClick={() => router.push(`/sources/${card.id}`)}
            onEdit={() => vm.startEditSource(card.id)}
            onToggleArchive={() => vm.handleToggleArchive(card.id)}
            onDelete={() => setDeleteTarget({ id: card.id, name: card.name })}
          />
        ))}
        {vm.pointsSourceCards.map((ps) => (
          <PointsSourceCard
            key={ps.id}
            id={ps.id}
            name={ps.name}
            memberName={ps.memberName}
            balance={ps.balance}
            affordableCount={ps.affordableCount}
            totalRedeemables={ps.redeemableCount}
            onClick={() => router.push(`/sources/points-${ps.id}`)}
          />
        ))}
      </div>

      {/* Row 4: Archived sources (collapsible) */}
      {vm.archivedSourceCards.length > 0 && (
        <div className="rounded-widget bg-secondary p-3 md:p-4">
          <button
            onClick={() => setArchiveOpen(!archiveOpen)}
            className="flex w-full items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {archiveOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <Archive className="h-4 w-4" />
            <span>已归档 ({vm.archivedSourceCards.length})</span>
          </button>
          {archiveOpen && (
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {vm.archivedSourceCards.map((card) => (
                <SourceCard
                  key={card.id}
                  id={card.id}
                  name={card.name}
                  memberName={card.memberName}
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
                  onClick={() => router.push(`/sources/${card.id}`)}
                  onEdit={() => vm.startEditSource(card.id)}
                  onToggleArchive={() => vm.handleToggleArchive(card.id)}
                  onDelete={() => setDeleteTarget({ id: card.id, name: card.name })}
                />
              ))}
            </div>
          )}
        </div>
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
        title="删除来源"
        description={`确定要删除「${deleteTarget?.name ?? ""}」吗？该操作不可撤销，所有关联的权益和核销记录将一并删除。`}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

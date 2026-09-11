"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import {
  Users,
  Globe,
  Palette,
  UserCircle,
  Plus,
  Pencil,
  Trash2,
  LogOut,
} from "lucide-react";
import { PageHeader } from "@nocoo/basalt/components/page-header";
import { Button, LayerCard, ThemeToggle } from "@nocoo/basalt";
import { useSettingsViewModel } from "@/viewmodels/useSettingsViewModel";
import { MemberFormDialog } from "@/components/MemberFormDialog";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { TimezoneSelect } from "@/components/TimezoneSelect";
import { SettingsSkeleton } from "@/components/SettingsSkeleton";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "members", label: "受益人", icon: Users },
  { id: "preferences", label: "偏好设置", icon: Palette },
  { id: "timezone", label: "时区", icon: Globe },
  { id: "account", label: "账户", icon: UserCircle },
] as const;

export default function SettingsPage() {
  const vm = useSettingsViewModel();
  const { data: session } = useSession();

  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const handleFormSubmit = () => {
    if (vm.editingMemberId) {
      vm.handleUpdateMember();
    } else {
      vm.handleCreateMember();
    }
  };

  const handleDeleteClick = (memberId: string, memberName: string) => {
    vm.checkMemberDeps(memberId);
    setDeleteTarget({ id: memberId, name: memberName });
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      vm.handleDeleteMember(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  if (vm.loading) {
    return <SettingsSkeleton />;
  }

  // Page-root visual state — see docs/07-ui-design-audit.md §3.5.3.
  const visualState = vm.members.length === 0 ? "empty" : "normal";

  return (
    <div className="space-y-6 md:space-y-8" data-visual-state={visualState}>
      <PageHeader
        title="设置"
        description="管理家庭受益人、偏好设置、时区与账户登录状态"
      />

      <div className="grid gap-4 md:gap-6 lg:grid-cols-4">
        {/* Left nav */}
        <nav className="lg:col-span-1">
          <LayerCard className="p-2 space-y-1">
            {SECTIONS.map((section) => (
              <Button
                key={section.id}
                variant={vm.activeSection === section.id ? "secondary" : "ghost"}
                onClick={() => vm.setActiveSection(section.id)}
                className={cn(
                  "flex w-full items-center justify-start gap-2 px-3 py-2 text-sm font-normal",
                  vm.activeSection === section.id && "font-medium text-basalt-foreground",
                )}
                icon={<section.icon className="h-4 w-4" strokeWidth={1.5} />}
              >
                {section.label}
              </Button>
            ))}
          </LayerCard>
        </nav>

        {/* Right content */}
        <div className="lg:col-span-3">
          {/* Members section */}
          {vm.activeSection === "members" && (
            <LayerCard className="p-4 md:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-medium text-basalt-foreground">家庭受益人</h3>
                <Button
                  size="sm"
                  onClick={() => vm.startNewMember()}
                  icon={<Plus className="h-4 w-4" />}
                >
                  添加受益人
                </Button>
              </div>

              {vm.members.length === 0 ? (
                <p className="text-sm text-basalt-muted-foreground text-center py-6">
                  暂无受益人，请添加家庭成员
                </p>
              ) : (
                <div className="space-y-2">
                  {vm.members.map((member) => (
                    <LayerCard.Well
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-basalt-card"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-basalt-secondary text-xl">
                          {member.avatar ?? "👤"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-basalt-foreground">
                            {member.name}
                          </p>
                          <p className="text-xs text-basalt-muted-foreground">
                            {member.relationshipLabel}
                            {member.sourceCount > 0 && ` · ${member.sourceCount} 个账户`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-basalt-muted-foreground hover:text-basalt-foreground"
                          onClick={() => vm.startEditMember(member.id)}
                          aria-label="编辑受益人"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-basalt-muted-foreground hover:text-basalt-destructive"
                          onClick={() => handleDeleteClick(member.id, member.name)}
                          aria-label="删除受益人"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </LayerCard.Well>
                  ))}
                </div>
              )}
            </LayerCard>
          )}

          {/* Preferences section */}
          {vm.activeSection === "preferences" && (
            <LayerCard className="p-4 md:p-6 space-y-4">
              <h3 className="text-base font-medium text-basalt-foreground">偏好设置</h3>

              <LayerCard.Well className="p-4 rounded-basalt-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-basalt-foreground">主题</p>
                    <p className="text-xs text-basalt-muted-foreground">切换浅色、深色或跟随系统</p>
                  </div>
                  <ThemeToggle aria-label="切换偏好主题" />
                </div>
              </LayerCard.Well>
            </LayerCard>
          )}

          {/* Timezone section */}
          {vm.activeSection === "timezone" && (
            <LayerCard className="p-4 md:p-6 space-y-4">
              <h3 className="text-base font-medium text-basalt-foreground">时区设置</h3>
              <LayerCard.Well className="p-4 rounded-basalt-card">
                <TimezoneSelect
                  value={vm.timezone}
                  onValueChange={vm.setTimezone}
                  options={vm.timezoneOptions}
                />
              </LayerCard.Well>
            </LayerCard>
          )}

          {/* Account section */}
          {vm.activeSection === "account" && (
            <LayerCard className="p-4 md:p-6 space-y-4">
              <h3 className="text-base font-medium text-basalt-foreground">账户信息</h3>
              <LayerCard.Well className="p-4 rounded-basalt-card space-y-3">
                {session?.user ? (
                  <>
                    <div className="flex items-center gap-3">
                      {session.user.image && (
                        <Image
                          src={session.user.image}
                          alt={session.user.name ?? ""}
                          width={48}
                          height={48}
                          className="h-12 w-12 rounded-full"
                          unoptimized
                        />
                      )}
                      <div>
                        <p className="text-sm font-medium text-basalt-foreground">
                          {session.user.name ?? "未知用户"}
                        </p>
                        <p className="text-xs text-basalt-muted-foreground">
                          {session.user.email ?? ""}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-basalt-muted-foreground">
                      通过 Google 账户登录
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-basalt-muted-foreground">未登录</p>
                )}
              </LayerCard.Well>

              <Button
                variant="outline"
                className="text-basalt-destructive hover:text-basalt-destructive"
                onClick={() => signOut({ callbackUrl: "/login" })}
                icon={<LogOut className="h-4 w-4" />}
              >
                退出登录
              </Button>
            </LayerCard>
          )}
        </div>
      </div>

      {/* Member Form Dialog */}
      <MemberFormDialog
        open={vm.memberFormOpen}
        onOpenChange={vm.setMemberFormOpen}
        editing={!!vm.editingMemberId}
        formInput={vm.memberFormInput}
        onFormInputChange={vm.setMemberFormInput}
        errors={vm.memberFormErrors}
        onSubmit={handleFormSubmit}
      />

      {/* Delete Confirm Dialog */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="删除受益人"
        description={`确定要删除「${deleteTarget?.name}」吗？`}
        dependents={vm.memberDependents}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

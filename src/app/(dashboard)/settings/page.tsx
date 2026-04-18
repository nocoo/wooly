"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
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
import { useSettingsViewModel } from "@/viewmodels/useSettingsViewModel";
import { MemberFormDialog } from "@/components/MemberFormDialog";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { TimezoneSelect } from "@/components/TimezoneSelect";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";

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

  return (
    <div className="grid gap-4 md:gap-6 lg:grid-cols-4">
      {/* Left nav */}
      <nav className="lg:col-span-1">
        <div className="rounded-card bg-secondary p-2 space-y-1">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              onClick={() => vm.setActiveSection(section.id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-widget px-3 py-2 text-sm transition-colors cursor-pointer",
                vm.activeSection === section.id
                  ? "bg-secondary text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
              )}
            >
              <section.icon className="h-4 w-4" strokeWidth={1.5} />
              {section.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Right content */}
      <div className="lg:col-span-3">
        {/* Members section */}
        {vm.activeSection === "members" && (
          <div className="rounded-card bg-secondary p-4 md:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium text-foreground">家庭受益人</h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  vm.setMemberFormOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                添加受益人
              </Button>
            </div>

            {vm.members.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                暂无受益人，请添加家庭成员
              </p>
            ) : (
              <div className="space-y-2">
                {vm.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-widget bg-secondary p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-xl">
                        {member.avatar ?? "👤"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {member.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {member.relationshipLabel}
                          {member.sourceCount > 0 && ` · ${member.sourceCount} 个账户`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => vm.startEditMember(member.id)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteClick(member.id, member.name)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Preferences section */}
        {vm.activeSection === "preferences" && (
          <div className="rounded-card bg-secondary p-4 md:p-6 space-y-4">
            <h3 className="text-base font-medium text-foreground">偏好设置</h3>

            {/* Theme */}
            <div className="rounded-widget bg-secondary p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">主题</p>
                  <p className="text-xs text-muted-foreground">切换浅色、深色或跟随系统</p>
                </div>
                <ThemeToggle />
              </div>
            </div>
          </div>
        )}

        {/* Timezone section */}
        {vm.activeSection === "timezone" && (
          <div className="rounded-card bg-secondary p-4 md:p-6 space-y-4">
            <h3 className="text-base font-medium text-foreground">时区设置</h3>
            <div className="rounded-widget bg-secondary p-4">
              <TimezoneSelect
                value={vm.timezone}
                onValueChange={vm.setTimezone}
                options={vm.timezoneOptions}
              />
            </div>
          </div>
        )}

        {/* Account section */}
        {vm.activeSection === "account" && (
          <div className="rounded-card bg-secondary p-4 md:p-6 space-y-4">
            <h3 className="text-base font-medium text-foreground">账户信息</h3>
            <div className="rounded-widget bg-secondary p-4 space-y-3">
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
                      <p className="text-sm font-medium text-foreground">
                        {session.user.name ?? "未知用户"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {session.user.email ?? ""}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    通过 Google 账户登录
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">未登录</p>
              )}
            </div>

            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="h-4 w-4 mr-2" />
              退出登录
            </Button>
          </div>
        )}
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
        description={`确定要删除「${deleteTarget?.name ?? ""}」吗？`}
        dependents={vm.memberDependents}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

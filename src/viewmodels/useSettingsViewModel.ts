// ViewModel for the Settings page.
// Composes model logic with data source — View consumes this hook only.

"use client";

import { useState, useMemo, useCallback } from "react";
import {
  members as mockMembers,
  sources as mockSources,
  pointsSources as mockPointsSources,
  defaultSettings,
} from "@/data/mock";
import type {
  Member,
  MemberRelationship,
  CreateMemberInput,
  ValidationError,
  DependentsSummary,
} from "@/models/types";
import {
  getRelationshipLabel,
  addMember,
  updateMember,
  removeMember,
  validateMemberInput,
  checkMemberDependents,
} from "@/models/member";

// ---------------------------------------------------------------------------
// ViewModel-local interfaces
// ---------------------------------------------------------------------------

export interface MemberItem {
  id: string;
  name: string;
  relationship: MemberRelationship;
  relationshipLabel: string;
  avatar: string | null;
  sourceCount: number;
}

export interface TimezoneOption {
  value: string;
  label: string;
  offsetLabel: string;
}

export interface SettingsViewModelResult {
  // Navigation
  activeSection: string;
  setActiveSection: (section: string) => void;

  // Member CRUD
  members: MemberItem[];
  memberFormOpen: boolean;
  setMemberFormOpen: (open: boolean) => void;
  editingMemberId: string | null;
  memberFormInput: CreateMemberInput;
  setMemberFormInput: (input: CreateMemberInput) => void;
  memberFormErrors: ValidationError[];
  handleCreateMember: () => void;
  handleUpdateMember: () => void;
  handleDeleteMember: (id: string) => void;
  startEditMember: (id: string) => void;
  memberDependents: DependentsSummary | null;
  checkMemberDeps: (memberId: string) => void;

  // Timezone
  timezone: string;
  setTimezone: (tz: string) => void;
  timezoneOptions: TimezoneOption[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_MEMBER_INPUT: CreateMemberInput = {
  name: "",
  relationship: "other",
};

const TIMEZONE_OPTIONS: TimezoneOption[] = [
  { value: "Asia/Shanghai", label: "Asia/Shanghai (UTC+8) 北京/上海", offsetLabel: "UTC+8" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo (UTC+9) 东京", offsetLabel: "UTC+9" },
  { value: "Asia/Hong_Kong", label: "Asia/Hong_Kong (UTC+8) 香港", offsetLabel: "UTC+8" },
  { value: "Asia/Singapore", label: "Asia/Singapore (UTC+8) 新加坡", offsetLabel: "UTC+8" },
  { value: "America/New_York", label: "America/New_York (UTC-5) 纽约", offsetLabel: "UTC-5" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (UTC-8) 洛杉矶", offsetLabel: "UTC-8" },
  { value: "America/Chicago", label: "America/Chicago (UTC-6) 芝加哥", offsetLabel: "UTC-6" },
  { value: "Europe/London", label: "Europe/London (UTC+0) 伦敦", offsetLabel: "UTC+0" },
  { value: "Europe/Paris", label: "Europe/Paris (UTC+1) 巴黎", offsetLabel: "UTC+1" },
  { value: "Europe/Berlin", label: "Europe/Berlin (UTC+1) 柏林", offsetLabel: "UTC+1" },
  { value: "Australia/Sydney", label: "Australia/Sydney (UTC+11) 悉尼", offsetLabel: "UTC+11" },
  { value: "Pacific/Auckland", label: "Pacific/Auckland (UTC+13) 奥克兰", offsetLabel: "UTC+13" },
];

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSettingsViewModel(): SettingsViewModelResult {
  const [members, setMembers] = useState<Member[]>([...mockMembers]);
  const [activeSection, setActiveSection] = useState("members");
  const [timezone, setTimezone] = useState(defaultSettings.timezone);

  // Member form state
  const [memberFormOpen, setMemberFormOpen] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [memberFormInput, setMemberFormInput] = useState<CreateMemberInput>(
    { ...DEFAULT_MEMBER_INPUT },
  );
  const [memberFormErrors, setMemberFormErrors] = useState<ValidationError[]>([]);
  const [memberDependents, setMemberDependents] = useState<DependentsSummary | null>(null);

  // Build member items with enriched display data
  const memberItems: MemberItem[] = useMemo(() => {
    return members.map((m) => {
      const sourceCount =
        mockSources.filter((s) => s.memberId === m.id).length;
      return {
        id: m.id,
        name: m.name,
        relationship: m.relationship,
        relationshipLabel: getRelationshipLabel(m.relationship),
        avatar: m.avatar,
        sourceCount,
      };
    });
  }, [members]);

  // Member CRUD
  const handleCreateMember = useCallback(() => {
    const errors = validateMemberInput(memberFormInput, members);
    if (errors.length > 0) {
      setMemberFormErrors(errors);
      return;
    }
    setMembers((prev) => addMember(prev, memberFormInput));
    setMemberFormInput({ ...DEFAULT_MEMBER_INPUT });
    setMemberFormErrors([]);
    setMemberFormOpen(false);
  }, [memberFormInput, members]);

  const handleUpdateMember = useCallback(() => {
    if (!editingMemberId) return;
    const errors = validateMemberInput(memberFormInput, members, editingMemberId);
    if (errors.length > 0) {
      setMemberFormErrors(errors);
      return;
    }
    setMembers((prev) => updateMember(prev, editingMemberId, memberFormInput));
    setEditingMemberId(null);
    setMemberFormInput({ ...DEFAULT_MEMBER_INPUT });
    setMemberFormErrors([]);
    setMemberFormOpen(false);
  }, [editingMemberId, memberFormInput, members]);

  const handleDeleteMember = useCallback((id: string) => {
    // NOTE: Cascade deletion of member's sources, benefits, and redemptions
    // is not yet implemented because those collections live in separate ViewModels.
    // This will be addressed when a shared data layer replaces per-VM state.
    setMembers((prev) => removeMember(prev, id));
  }, []);

  const startEditMember = useCallback(
    (id: string) => {
      const member = members.find((m) => m.id === id);
      if (!member) return;
      setEditingMemberId(id);
      setMemberFormInput({
        name: member.name,
        relationship: member.relationship,
        avatar: member.avatar,
      });
      setMemberFormErrors([]);
      setMemberFormOpen(true);
    },
    [members],
  );

  const checkMemberDeps = useCallback((memberId: string) => {
    const deps = checkMemberDependents(memberId, mockSources, mockPointsSources);
    setMemberDependents(deps);
  }, []);

  return {
    activeSection,
    setActiveSection,
    members: memberItems,
    memberFormOpen,
    setMemberFormOpen,
    editingMemberId,
    memberFormInput,
    setMemberFormInput,
    memberFormErrors,
    handleCreateMember,
    handleUpdateMember,
    handleDeleteMember,
    startEditMember,
    memberDependents,
    checkMemberDeps,
    timezone,
    setTimezone,
    timezoneOptions: TIMEZONE_OPTIONS,
  };
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Settings,
  Search,
  PanelLeft,
  LogOut,
  Wallet,
  CheckCircle,
} from "lucide-react";
import {
  Sidebar,
  SidebarHeader,
  SidebarNav,
  SidebarFooter,
  SidebarItem,
  SidebarIconItem,
  SidebarPartition,
  SidebarSearch,
  SidebarUser,
  Button,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  Avatar,
  AvatarFallback,
  AvatarImage,
  CommandPalette,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@nocoo/basalt";
import { Logo } from "@/components/Logo";
import { APP_VERSION } from "@/lib/version";

interface NavItem {
  title: string;
  icon: React.ElementType;
  path: string;
  badge?: number;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "总览",
    items: [
      { title: "仪表盘", icon: LayoutDashboard, path: "/" },
      { title: "权益账户", icon: Wallet, path: "/sources" },
      { title: "核销台", icon: CheckCircle, path: "/tracker" },
    ],
  },
  {
    label: "系统",
    items: [{ title: "设置", icon: Settings, path: "/settings" }],
  },
];

const ALL_NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [searchOpen, setSearchOpen] = useState(false);

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSelect = useCallback(
    (path: string) => {
      setSearchOpen(false);
      router.push(path);
    },
    [router],
  );

  const active = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  const userAvatar = (
    <Avatar className="h-8 w-8 cursor-pointer">
      <AvatarImage
        src={session?.user?.image ?? undefined}
        alt={session?.user?.name ?? "User"}
      />
      <AvatarFallback className="text-xs">
        {session?.user?.name?.[0]?.toUpperCase() ?? "U"}
      </AvatarFallback>
    </Avatar>
  );

  return (
    <>
      <Sidebar collapsed={collapsed}>
        {collapsed ? (
          /* ── Collapsed Sidebar ── */
          <>
            <SidebarHeader className="justify-center px-0">
              <Logo size="sm" />
            </SidebarHeader>

            <Button
              variant="ghost"
              size="icon"
              className="mb-1 self-center h-8 w-8"
              onClick={onToggle}
              aria-label="Expand sidebar"
            >
              <PanelLeft className="h-4 w-4" strokeWidth={1.5} />
            </Button>

            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <SidebarIconItem
                  className="mb-2 self-center"
                  onClick={() => setSearchOpen(true)}
                  aria-label="搜索 (⌘K)"
                >
                  <Search className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                </SidebarIconItem>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                搜索 (⌘K)
              </TooltipContent>
            </Tooltip>

            <SidebarNav className="w-full items-center gap-1 pt-1">
              {ALL_NAV_ITEMS.map((item) => (
                <Tooltip key={item.path} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <SidebarIconItem
                      active={active(item.path)}
                      aria-label={item.title}
                      className="self-center relative"
                      onClick={() => router.push(item.path)}
                    >
                      <item.icon className="h-4 w-4" strokeWidth={1.5} />
                      {item.badge && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-basalt-destructive px-1 text-[10px] font-medium text-basalt-destructive-foreground">
                          {item.badge}
                        </span>
                      )}
                    </SidebarIconItem>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {item.title}
                  </TooltipContent>
                </Tooltip>
              ))}
            </SidebarNav>

            <SidebarFooter className="flex w-full justify-center px-0">
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <span className="inline-flex">{userAvatar}</span>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {session?.user?.name ?? "User"}
                </TooltipContent>
              </Tooltip>
            </SidebarFooter>
          </>
        ) : (
          /* ── Expanded Sidebar ── */
          <>
            <SidebarHeader>
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Logo size="sm" />
                  <span className="text-[31px] font-bold font-handwriting tracking-tighter mt-[-12px] text-basalt-foreground leading-none">
                    wooly
                  </span>
                  <span className="shrink-0 rounded-md bg-basalt-secondary px-1.5 py-0.5 text-[10px] leading-none font-medium text-basalt-muted-foreground">
                    v{APP_VERSION}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={onToggle}
                  aria-label="Collapse sidebar"
                >
                  <PanelLeft className="h-4 w-4" strokeWidth={1.5} />
                </Button>
              </div>
            </SidebarHeader>

            <div className="px-3 pb-1">
              <SidebarSearch
                shortcut="⌘K"
                onClick={() => setSearchOpen(true)}
              >
                搜索
              </SidebarSearch>
            </div>

            <SidebarNav className="pt-1">
              {NAV_GROUPS.map((group) => (
                <div key={group.label} className="mb-2">
                  <SidebarPartition>{group.label}</SidebarPartition>
                  <div className="flex flex-col gap-0.5 px-3">
                    {group.items.map((item) => (
                      <SidebarItem
                        key={item.path}
                        active={active(item.path)}
                        onClick={() => router.push(item.path)}
                      >
                        <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                        <span className="flex-1 truncate text-left">{item.title}</span>
                        {item.badge && (
                          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-basalt-destructive px-1.5 text-[11px] font-medium text-basalt-destructive-foreground">
                            {item.badge}
                          </span>
                        )}
                      </SidebarItem>
                    ))}
                  </div>
                </div>
              ))}
            </SidebarNav>

            <SidebarFooter>
              <SidebarUser
                name={session?.user?.name ?? "User"}
                email={session?.user?.email ?? ""}
                avatar={userAvatar}
                action={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-basalt-muted-foreground hover:text-basalt-foreground"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    aria-label="退出登录"
                  >
                    <LogOut className="h-4 w-4" strokeWidth={1.5} />
                  </Button>
                }
              />
            </SidebarFooter>
          </>
        )}
      </Sidebar>

      {/* Cmd+K Search Palette */}
      <CommandPalette open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput placeholder="搜索页面..." />
        <CommandList>
          <CommandEmpty>未找到结果</CommandEmpty>
          {NAV_GROUPS.map((group) => (
            <CommandGroup key={group.label} heading={group.label}>
              {group.items.map((item) => (
                <CommandItem
                  key={item.path}
                  value={item.title}
                  onSelect={() => handleSelect(item.path)}
                >
                  <item.icon className="h-4 w-4 text-basalt-muted-foreground" strokeWidth={1.5} />
                  <span>{item.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandPalette>
    </>
  );
}

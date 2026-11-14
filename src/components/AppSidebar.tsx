import { useState, useEffect, useCallback, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router";
import { useMe } from "@/hooks/use-me";
import { getDisplayName } from "@/lib/user-display";
import {
  LayoutDashboard,
  Settings,
  Wallet,
  CheckCircle,
  type LucideIcon,
} from "lucide-react";
import {
  Sidebar as BasaltSidebar,
  SidebarBrand,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarIconItem,
  SidebarItem,
  SidebarNav,
  SidebarProvider,
  SidebarSearch,
  SidebarToggle,
  SidebarUser,
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
import { useSidebar } from "@nocoo/basalt/components/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@nocoo/basalt/components/tooltip";
import { APP_VERSION } from "@/lib/version";

const ACCESS_LOGOUT_URL = "/cdn-cgi/access/logout";
const SIDEBAR_COLLAPSED_KEY = "wooly:sidebar-collapsed";
type SidebarCollapsedPreference = "false" | "true";

interface NavItem {
  title: string;
  icon: LucideIcon;
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

function isActive(pathname: string, path: string): boolean {
  if (path === "/") return pathname === "/";
  return pathname.startsWith(path);
}

function usePersistedSidebarCollapsed(
  key: string,
  defaultValue: SidebarCollapsedPreference,
): [SidebarCollapsedPreference, (value: SidebarCollapsedPreference) => void] {
  const [stored, setStored] = useState<SidebarCollapsedPreference>(() => {
    if (typeof window === "undefined") return defaultValue;
    const value = localStorage.getItem(key);
    return value === "true" || value === "false" ? value : defaultValue;
  });

  const setValue = useCallback(
    (next: SidebarCollapsedPreference) => {
      setStored(next);
      localStorage.setItem(key, next);
    },
    [key],
  );

  return [stored, setValue];
}

export function PersistedSidebarProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = usePersistedSidebarCollapsed(SIDEBAR_COLLAPSED_KEY, "false");
  const collapsed = stored === "true";
  const onCollapsedChange = useCallback(
    (next: boolean) => {
      setStored(next ? "true" : "false");
    },
    [setStored],
  );

  return (
    <SidebarProvider collapsed={collapsed} onCollapsedChange={onCollapsedChange} defaultWidth={260}>
      {children}
    </SidebarProvider>
  );
}

interface SidebarProps {
  ariaLabel: string;
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
  onDismiss?: () => void;
}

function WoolySidebarBody({
  variant,
  onNavigate,
  onDismiss,
}: {
  variant?: SidebarProps["variant"];
  onNavigate?: () => void;
  onDismiss?: () => void;
}) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { data: meUser } = useMe();
  const { collapsed, peek, peeking } = useSidebar();
  const railCollapsed = collapsed && !(peek && peeking);
  const [searchOpen, setSearchOpen] = useState(false);
  const { name: userName, initial, email: userEmail, avatar: userAvatarUrl } = getDisplayName(meUser);

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
      navigate(path);
      onNavigate?.();
    },
    [navigate, onNavigate],
  );

  const avatar = (
    <Avatar>
      {userAvatarUrl ? <AvatarImage src={userAvatarUrl} alt={userName} /> : null}
      <AvatarFallback className="text-basalt-sm">{initial}</AvatarFallback>
    </Avatar>
  );

  return (
    <>
      <SidebarHeader>
        <SidebarBrand
          logo={<img src="/logo-24.png" alt="" width={24} height={24} />}
          name="wooly"
          version={`v${APP_VERSION}`}
          action={
            variant === "mobile" ? (
              <SidebarToggle
                mode="dismiss"
                dismissLabel="关闭导航菜单"
                {...(onDismiss ? { onDismiss } : {})}
              />
            ) : (
              <SidebarToggle expandLabel="展开侧边栏" collapseLabel="收起侧边栏" />
            )
          }
        />
      </SidebarHeader>
      <SidebarNav>
        <SidebarSearch
          shortcut="⌘K"
          onClick={(event) => {
            event.preventDefault();
            setSearchOpen(true);
          }}
        >
          搜索
        </SidebarSearch>
        {railCollapsed
          ? ALL_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item.path);
              return (
                <Tooltip key={item.path} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <SidebarIconItem
                      href={item.path}
                      active={active}
                      aria-label={item.title}
                      onClick={onNavigate}
                    >
                      <Icon className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                    </SidebarIconItem>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {item.title}
                  </TooltipContent>
                </Tooltip>
              );
            })
          : NAV_GROUPS.map((group) => (
              <SidebarGroup key={group.label} label={group.label}>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(pathname, item.path);
                  return (
                    <SidebarItem
                      key={item.path}
                      href={item.path}
                      active={active}
                      onClick={onNavigate}
                    >
                      <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                      <span className="flex-1 truncate text-left">{item.title}</span>
                      {item.badge != null && item.badge > 0 ? (
                        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-basalt-destructive px-1.5 text-[11px] font-medium text-basalt-destructive-foreground">
                          {item.badge}
                        </span>
                      ) : null}
                    </SidebarItem>
                  );
                })}
              </SidebarGroup>
            ))}
      </SidebarNav>
      <SidebarFooter>
        <SidebarUser
          name={userName}
          email={userEmail || undefined}
          avatar={avatar}
          tooltip={userName}
          signOutHref={ACCESS_LOGOUT_URL}
          signOutLabel="退出登录"
        />
      </SidebarFooter>

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

export function AppSidebar({ ariaLabel, variant = "desktop", onNavigate, onDismiss }: SidebarProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <BasaltSidebar aria-label={ariaLabel} resizable={false}>
        <WoolySidebarBody
          variant={variant}
          {...(onNavigate ? { onNavigate } : {})}
          {...(onDismiss ? { onDismiss } : {})}
        />
      </BasaltSidebar>
    </TooltipProvider>
  );
}

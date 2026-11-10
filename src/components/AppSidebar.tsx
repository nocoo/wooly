import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router";
import { useSession } from "@/components/SessionProvider";
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
  SidebarGroup,
  SidebarSearch,
  SidebarUser,
  Button,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  Avatar,
  AvatarFallback,
  CommandPalette,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@nocoo/basalt";
import { Link } from "@nocoo/basalt/components/link";
import { Logo } from "@/components/Logo";
import { APP_VERSION } from "@/lib/version";
import { cn } from "@/lib/utils";

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

const SIDEBAR_MARK_SLOT_CLASS = "flex w-full items-center";

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const location = useLocation();
  const pathname = location.pathname;
  const navigate = useNavigate();
  const { user, logout } = useSession();
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
      navigate(path);
    },
    [navigate],
  );

  const active = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  const userAvatar = (
    <Avatar className="h-9 w-9 shrink-0 cursor-pointer">
      <AvatarFallback className="text-basalt-sm">
        {user?.name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? "U"}
      </AvatarFallback>
    </Avatar>
  );

  return (
    <>
      <Sidebar collapsed={collapsed}>
        <SidebarHeader>
          <div
            className={cn(
              SIDEBAR_MARK_SLOT_CLASS,
              collapsed ? "justify-center" : "justify-between pl-basalt-layout-sm",
            )}
          >
            <Link
              href="/"
              aria-label="首页"
              className="flex items-center gap-basalt-space-lg text-basalt-foreground no-underline hover:no-underline"
            >
              <Logo size="sm" />
              {collapsed ? null : (
                <>
                  <span className="text-basalt-xl font-semibold text-basalt-foreground">wooly</span>
                  <span className="rounded-basalt-md bg-basalt-secondary px-basalt-space-md py-basalt-space-xs text-basalt-sm leading-basalt-tight font-medium text-basalt-muted-foreground">
                    v{APP_VERSION}
                  </span>
                </>
              )}
            </Link>
            {collapsed ? null : (
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggle}
                aria-label="收起侧边栏"
              >
                <PanelLeft className="h-4 w-4" aria-hidden="true" strokeWidth={1.5} />
              </Button>
            )}
          </div>
        </SidebarHeader>

        {collapsed ? (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              aria-label="展开侧边栏"
            >
              <PanelLeft className="h-4 w-4" aria-hidden="true" strokeWidth={1.5} />
            </Button>

            <SidebarNav>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <SidebarIconItem
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

              {ALL_NAV_ITEMS.map((item) => (
                <Tooltip key={item.path} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <SidebarIconItem
                      active={active(item.path)}
                      aria-label={item.title}
                      className="relative"
                      onClick={() => navigate(item.path)}
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

            <SidebarFooter>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  {userAvatar}
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {user?.name ?? "User"}
                </TooltipContent>
              </Tooltip>
            </SidebarFooter>
          </>
        ) : (
          <>
            <div className="px-basalt-nav-inset">
              <SidebarSearch shortcut="⌘K" onClick={() => setSearchOpen(true)}>
                搜索
              </SidebarSearch>
            </div>

            <SidebarNav>
              {NAV_GROUPS.map((group) => (
                <SidebarGroup key={group.label} label={group.label} defaultOpen>
                  {group.items.map((item) => (
                    <SidebarItem
                      key={item.path}
                      active={active(item.path)}
                      onClick={() => navigate(item.path)}
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
                </SidebarGroup>
              ))}
            </SidebarNav>

            <SidebarFooter>
              <SidebarUser
                name={user?.name ?? "User"}
                email={user?.email ?? ""}
                avatar={userAvatar}
                action={
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={logout}
                    aria-label="退出登录"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" strokeWidth={1.5} />
                  </Button>
                }
              />
            </SidebarFooter>
          </>
        )}
      </Sidebar>

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

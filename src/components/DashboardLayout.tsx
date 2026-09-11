"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  AppShell,
  AppMain,
  AppSkipLink,
} from "@nocoo/basalt/components/app-shell";
import { AppHeader } from "@nocoo/basalt/components/app-header";
import {
  ContentIsland,
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
  Button,
  ThemeToggle,
} from "@nocoo/basalt";
import { AppSidebar } from "@/components/AppSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu } from "lucide-react";
import { GitHubIcon } from "@/components/icons/GitHubIcon";

// Map route paths to page titles
const PAGE_TITLES: Record<string, string> = {
  "/": "仪表盘",
  "/sources": "权益账户",
  "/tracker": "核销台",
  "/settings": "设置",
};

/**
 * Inner layout component that resets mobileOpen state via key prop
 * when pathname changes.
 */
function LayoutInner({
  children,
  pathname,
}: {
  children: React.ReactNode;
  pathname: string;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);

  const title =
    PAGE_TITLES[pathname] ??
    (pathname.startsWith("/sources/") ? "账户详情" : "仪表盘");

  // Determine ancestor breadcrumbs
  const breadcrumbs: { href?: string; label: React.ReactNode }[] = [];
  if (pathname.startsWith("/sources/")) {
    breadcrumbs.push({ href: "/sources", label: "权益账户" });
  }

  // Close mobile sheet if window expands above mobile breakpoint
  useEffect(() => {
    if (!isMobile && mobileOpen) {
      setMobileOpen(false);
    }
  }, [isMobile, mobileOpen]);

  return (
    <AppShell>
      <AppSkipLink>跳至主内容</AppSkipLink>

      {/* Desktop sidebar: hidden on mobile screens via CSS to avoid initial SSR layout shift,
          and only mounted on desktop once hydrated to prevent duplicate global Cmd+K shortcuts */}
      {!isMobile && (
        <div className="hidden md:flex shrink-0">
          <AppSidebar
            collapsed={collapsed}
            onToggle={() => setCollapsed(!collapsed)}
          />
        </div>
      )}

      {/* Mobile drawer: Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-[260px] max-w-[260px] border-0 bg-basalt-background p-0"
        >
          <SheetTitle className="sr-only">导航菜单</SheetTitle>
          {mobileOpen && (
            <AppSidebar
              collapsed={false}
              onToggle={() => setMobileOpen(false)}
            />
          )}
        </SheetContent>

        <AppMain>
          <AppHeader
            leading={
              isMobile ? (
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    aria-label="打开导航菜单"
                  >
                    <Menu className="h-5 w-5" aria-hidden="true" strokeWidth={1.5} />
                  </Button>
                </SheetTrigger>
              ) : null
            }
            breadcrumbs={breadcrumbs.length > 0 ? breadcrumbs : undefined}
            title={title}
            actions={
              <div className="flex items-center gap-1">
                <Button
                  asChild
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-basalt-muted-foreground hover:text-basalt-foreground"
                >
                  <a
                    href="https://github.com/nocoo/wooly"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="GitHub repository"
                  >
                    <GitHubIcon className="h-[18px] w-[18px]" />
                  </a>
                </Button>
                <ThemeToggle aria-label="切换主题" />
              </div>
            }
          />

          <div className="flex min-h-0 flex-1 flex-col px-2 pb-2 md:px-3 md:pb-3">
            <ContentIsland>{children}</ContentIsland>
          </div>
        </AppMain>
      </Sheet>
    </AppShell>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <LayoutInner key={pathname} pathname={pathname}>
      {children}
    </LayoutInner>
  );
}

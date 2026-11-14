import { Suspense, useEffect, useId, useRef } from "react";
import { useLocation } from "react-router";
import {
  AppShell,
  AppMain,
  AppSkipLink,
} from "@nocoo/basalt/components/app-shell";
import {
  AppHeader,
  AppHeaderMenuButton,
  ProjectLinks,
} from "@nocoo/basalt/components/app-header";
import { ThemeToggle } from "@nocoo/basalt/components/theme-toggle";
import {
  ContentIsland,
  LayerCard,
  SidebarDrawer,
} from "@nocoo/basalt";
import { AppSidebar, PersistedSidebarProvider } from "@/components/AppSidebar";
import { MobileNavProvider, useMobileNav } from "@/components/layout/mobile-nav-context";
import { useIsMobile } from "@/hooks/use-mobile";

const PAGE_TITLES: Record<string, string> = {
  "/": "仪表盘",
  "/sources": "权益账户",
  "/tracker": "核销台",
  "/settings": "设置",
};

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const isMobile = useIsMobile();
  const { mobileOpen, setMobileOpen } = useMobileNav();
  const menuButton = useRef<HTMLButtonElement>(null);
  const drawerId = useId();

  const title =
    PAGE_TITLES[pathname] ??
    (pathname.startsWith("/sources/") ? "账户详情" : "仪表盘");

  const breadcrumbs: { href?: string; label: React.ReactNode }[] = [
    { href: "/", label: "首页" },
  ];
  if (pathname.startsWith("/sources/")) {
    breadcrumbs.push({ href: "/sources", label: "权益账户" });
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname triggers close on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  useEffect(() => {
    if (!isMobile && mobileOpen) {
      setMobileOpen(false);
    }
  }, [isMobile, mobileOpen, setMobileOpen]);

  return (
    <AppShell>
      <AppSkipLink href="#main-content">跳至主内容</AppSkipLink>

      {!isMobile && (
        <PersistedSidebarProvider>
          <AppSidebar ariaLabel="主导航" />
        </PersistedSidebarProvider>
      )}

      {isMobile && (
        <SidebarDrawer
          id={drawerId}
          open={mobileOpen}
          onOpenChange={setMobileOpen}
          returnFocusRef={menuButton}
          title="导航菜单"
          description="浏览 Wooly 的主要页面"
        >
          <AppSidebar
            ariaLabel="主导航抽屉"
            variant="mobile"
            onNavigate={() => setMobileOpen(false)}
            onDismiss={() => setMobileOpen(false)}
          />
        </SidebarDrawer>
      )}

      <AppMain>
        <AppHeader
          leading={
            isMobile ? (
              <AppHeaderMenuButton
                ref={menuButton}
                label="打开导航菜单"
                aria-expanded={mobileOpen}
                aria-haspopup="dialog"
                aria-controls={drawerId}
                onClick={() => setMobileOpen(true)}
              />
            ) : null
          }
          breadcrumbs={breadcrumbs}
          breadcrumbsLabel="面包屑导航"
          title={title}
          actions={
            <>
              <ProjectLinks github="nocoo/wooly" hexly="wooly" name="Wooly" />
              <ThemeToggle
                labels={{
                  light: "Switch to light theme",
                  dark: "Switch to dark theme",
                  system: "Use system theme",
                }}
              />
            </>
          }
        />

        <div className="flex min-h-0 flex-1 flex-col px-2 pb-2 md:px-3 md:pb-3">
          <ContentIsland>
            <Suspense key={pathname} fallback={<LayerCard.Loading label="页面加载中..." />}>
              {children}
            </Suspense>
          </ContentIsland>
        </div>
      </AppMain>
    </AppShell>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <MobileNavProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </MobileNavProvider>
  );
}

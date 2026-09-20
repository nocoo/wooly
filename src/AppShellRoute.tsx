import { Outlet } from "react-router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DatasetProvider } from "@/hooks/use-dataset-context";
import { useSession } from "@/components/SessionProvider";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Button } from "@nocoo/basalt";

export function AppShellRoute() {
  const { user, loading, error, reauth } = useSession();

  if (loading) {
    return <LoadingScreen label="验证登录状态中..." />;
  }

  if (error || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-basalt-background p-4 text-center">
        <p className="text-lg font-medium text-basalt-foreground">未登录或会话已过期</p>
        <p className="mt-1 text-sm text-basalt-muted-foreground">请通过 Cloudflare Access 验证身份以访问控制台</p>
        <div className="mt-6 flex items-center gap-3">
          <Button onClick={() => (window.location.href = "/")}>
            重新登录
          </Button>
          <Button variant="outline" onClick={reauth}>
            重试
          </Button>
        </div>
      </div>
    );
  }

  return (
    <DatasetProvider>
      <DashboardLayout>
        <Outlet />
      </DashboardLayout>
    </DatasetProvider>
  );
}

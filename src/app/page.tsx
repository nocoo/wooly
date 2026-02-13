import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card className="h-full rounded-card border-0 bg-secondary shadow-none">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              Welcome to wooly
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold text-foreground font-display tracking-tight">
            Get Started
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Edit this page at <code className="text-xs bg-muted px-1.5 py-0.5 rounded">src/app/page.tsx</code>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

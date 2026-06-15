import { DashboardLayout } from "@/components/DashboardLayout";
import { DatasetProvider } from "@/hooks/use-dataset-context";

export default function DashboardGroupLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <DatasetProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </DatasetProvider>
  );
}

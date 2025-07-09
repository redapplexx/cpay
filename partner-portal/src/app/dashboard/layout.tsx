import { PartnerDashboardLayout } from "@/components/layout/PartnerDashboardLayout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PartnerDashboardLayout>{children}</PartnerDashboardLayout>;
}

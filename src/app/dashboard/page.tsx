import { DashboardClient } from "./dashboard-client"
import { getVendors, getAuditLogs, getChartData } from "@/lib/db"

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const vendors = await getVendors();
  const auditLogs = await getAuditLogs();
  const chartData = await getChartData();

  return <DashboardClient vendors={vendors} auditLogs={auditLogs} chartData={chartData} />
}

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldCheck, AlertTriangle, ShieldX, Activity, CheckCircle2, XCircle } from "lucide-react"
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Vendor, AuditLog } from "@/lib/db"

interface DashboardClientProps {
  vendors: Vendor[];
  auditLogs: AuditLog[];
  chartData: any[];
}

export function DashboardClient({ vendors, auditLogs, chartData }: DashboardClientProps) {
  const stats = {
    total: vendors.length,
    approved: vendors.filter(v => v.status === "APPROVED").length,
    hold: vendors.filter(v => v.status === "HOLD").length,
    rejected: vendors.filter(v => v.status === "REJECTED").length,
  }

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Analytics Hub</h2>
          <p className="text-slate-500 mt-1 cursor-default">Overview & vital statistics</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Vendors */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Vendors</CardTitle>
            <div className="h-8 w-8 bg-blue-50 rounded-full flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{stats.total}</div>
            <p className="text-xs text-slate-500 mt-1">+2 since last week</p>
          </CardContent>
        </Card>

        {/* Approved */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Approved</CardTitle>
            <div className="h-8 w-8 bg-emerald-50 rounded-full flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{stats.approved}</div>
            <p className="text-xs text-slate-500 mt-1 text-emerald-600">Stable compliance</p>
          </CardContent>
        </Card>

        {/* Action Required (HOLD) */}
        <Card className="hover:shadow-md transition-shadow ring-1 ring-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-900">Action Required</CardTitle>
            <div className="h-8 w-8 bg-amber-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-700">{stats.hold}</div>
            <p className="text-xs text-amber-600 mt-1 font-medium">Validation pending</p>
          </CardContent>
        </Card>

        {/* Rejected */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Rejected</CardTitle>
            <div className="h-8 w-8 bg-rose-50 rounded-full flex items-center justify-center">
              <ShieldX className="h-4 w-4 text-rose-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{stats.rejected}</div>
            <p className="text-xs text-slate-500 mt-1 text-rose-600">High risk flags</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">

        {/* Compliance Health Chart */}
        <Card className="md:col-span-2 lg:col-span-4 hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Activity className="mr-2 h-5 w-5 text-indigo-500" />
              Daily Validation Activity (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[380px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  
                  <XAxis 
                    dataKey="date" 
                    stroke="#94A3B8" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={10}
                    interval={Math.floor(chartData.length / 6)} // Reduce date density
                  />
                  
                  <YAxis 
                    stroke="#94A3B8" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  
                  <Tooltip
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: '1px solid #F1F5F9',
                      boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(8px)',
                      padding: '12px'
                    }}
                  />
                  
                  <Legend 
                    verticalAlign="top" 
                    align="right"
                    wrapperStyle={{ paddingBottom: '40px' }}
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => <span className="text-slate-600 font-medium text-sm ml-1 uppercase tracking-wider">{value}</span>}
                  />
                  
                  {/* Background Volume Bar */}
                  <Bar 
                    dataKey="total" 
                    name="Total Growth" 
                    fill="#F1F5F9" 
                    radius={[10, 10, 0, 0]} 
                    barSize={40}
                  />
                  
                  {/* Trajectory Lines */}
                  <Line 
                    type="monotone" 
                    dataKey="approved" 
                    name="Approved" 
                    stroke="#10B981" 
                    strokeWidth={4} 
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 0 }} 
                  />
                  
                  <Line 
                    type="monotone" 
                    dataKey="hold" 
                    name="Hold" 
                    stroke="#F59E0B" 
                    strokeWidth={4} 
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 0 }} 
                  />
                  
                  <Line 
                    type="monotone" 
                    dataKey="rejected" 
                    name="Rejected" 
                    stroke="#F43F5E" 
                    strokeWidth={4} 
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 0 }} 
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Feed */}
        <Card className="md:col-span-2 lg:col-span-3 hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">Audit Events Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {auditLogs.map((log, index) => (
                <div key={log.id} className="flex relative">
                  {/* Timeline connecting line */}
                  {index !== auditLogs.length - 1 && (
                    <div className="absolute top-8 bottom-[-24px] left-[15px] w-px bg-slate-200" />
                  )}

                  <div className="relative mr-4 mt-1">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-white ring-1 ring-white ${log.type === 'SUCCESS' ? 'bg-emerald-100' :
                      log.type === 'ERROR' ? 'bg-rose-100' : 'bg-amber-100'
                      }`}>
                      {log.type === 'SUCCESS' && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                      {log.type === 'ERROR' && <XCircle className="h-4 w-4 text-rose-600" />}
                      {log.type === 'ALERT' && <AlertTriangle className="h-4 w-4 text-amber-600" />}
                    </div>
                  </div>

                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-900">{log.vendorName}</p>
                      <span className="text-xs text-slate-400">{log.timestamp}</span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1 leading-snug">{log.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

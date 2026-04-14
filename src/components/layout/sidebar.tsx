"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, UploadCloud, UserPlus, ShieldCheck, CreditCard } from "lucide-react"
import { cn } from "@/lib/utils"

const adminNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Vendor Reports", href: "/vendors", icon: Users },
  { name: "Payments", href: "/payments", icon: CreditCard },
  { name: "Upload Data", href: "/upload", icon: UploadCloud },
]

export function Sidebar({ user }: { user: { user_type?: string; vendor_id?: string } | null }) {
  const pathname = usePathname()
  const isVendor = user?.user_type?.toLowerCase() === "vendor"

  const vendorNavigation = [
    { name: "My Profile", href: `/vendor-dashboard/${user?.vendor_id}`, icon: UserPlus },
    { name: "Payment History", href: `/vendor-dashboard/${user?.vendor_id}/payments`, icon: CreditCard },
  ]

  const navigation = isVendor ? vendorNavigation : adminNavigation

  return (
    <div className="flex h-full w-64 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-16 items-center px-6 border-b border-slate-100">
        <Link href="/dashboard" className="flex items-center gap-2">
          {/* <img src="/images/logo_trans.png" alt="Klear View Logo" className="h-8 w-auto object-contain" /> */}
          <span className="text-lg font-bold text-slate-900 tracking-tight">Klear View</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="flex flex-col space-y-1 px-3">
          {navigation.map((item) => {
            const isVendorDashboardBase = isVendor && item.name === "My Profile"
            const isActive = isVendorDashboardBase
              ? pathname === item.href
              : pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-indigo-50 text-indigo-700 relative"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-full w-1 bg-indigo-500 rounded-r-md" />
                )}
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                    isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-500"
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}


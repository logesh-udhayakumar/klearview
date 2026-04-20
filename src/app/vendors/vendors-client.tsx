"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, Filter, ArrowRight, ChevronLeft, ChevronRight, Plus, Download, Pointer, Loader2 } from "lucide-react"
import ExcelJS from "exceljs"
import { saveAs } from "file-saver"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Vendor, VendorStatus } from "@/lib/db"
import { cn } from "@/lib/utils"

interface VendorsClientProps {
  initialVendors: Vendor[];
}

export function VendorsClient({ initialVendors }: VendorsClientProps) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<VendorStatus | "ALL">("ALL")
  const [currentPage, setCurrentPage] = useState(1)
  const [limit, setLimit] = useState(5)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    setCurrentPage(1)
  }, [search, filter, limit])

  const filteredVendors = initialVendors.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.pan.toLowerCase().includes(search.toLowerCase()) ||
      v.gst.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === "ALL" || v.status === filter
    return matchesSearch && matchesFilter
  })

  const totalPages = Math.max(1, Math.ceil(filteredVendors.length / limit))
  const paginatedVendors = filteredVendors.slice((currentPage - 1) * limit, currentPage * limit)

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, currentPage + 2);

      if (start === 1) end = maxVisiblePages;
      if (end === totalPages) start = totalPages - maxVisiblePages + 1;

      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  };
  const handleExport = async () => {
    setIsExporting(true)
    try {
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet("Vendors")

      // Define columns
      worksheet.columns = [
        { header: "S.No", key: "sno", width: 10 },
        { header: "Vendor ID", key: "vendorId", width: 15 },
        { header: "Vendor Name", key: "name", width: 30 },
        { header: "PAN", key: "pan", width: 20 },
        { header: "GST", key: "gst", width: 20 },
        { header: "Status", key: "status", width: 15 },
        { header: "Bank Name", key: "bankName", width: 25 },
        { header: "Account Number", key: "bankAccount", width: 25 },
        { header: "IFSC", key: "ifsc", width: 15 },
        { header: "Registration Date", key: "registeredDate", width: 20 },
        { header: "Last Updated", key: "lastUpdated", width: 20 },
      ]

      // Style the header row (Blue background, white text)
      const headerRow = worksheet.getRow(1)
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF4F46E5" }, // Indigo-600
        }
        cell.font = {
          color: { argb: "FFFFFFFF" },
          bold: true,
        }
        cell.alignment = { vertical: "middle", horizontal: "center" }
      })

      // Add data rows
      filteredVendors.forEach((v, index) => {
        worksheet.addRow({
          sno: index + 1,
          vendorId: v.vendorId,
          name: v.name,
          pan: v.pan,
          gst: v.gst,
          status: v.status,
          bankName: v.bankName || "N/A",
          bankAccount: v.bankAccount,
          ifsc: v.ifsc,
          registeredDate: new Date(v.registeredDate).toLocaleDateString(),
          lastUpdated: new Date(v.lastUpdated).toLocaleDateString(),
        })
      })

      // Generate buffer and save
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
      saveAs(blob, `Vendors_Export_${new Date().toISOString().split("T")[0]}.xlsx`)
    } catch (error) {
      console.error("Export error:", error)
      alert("Failed to export data. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Vendor Details</h2>
          <p className="text-slate-500 mt-1 cursor-default">Manage and monitor vendor profiles</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/add-vendor")}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Vendor
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 rounded-lg transition-colors shadow-sm font-medium text-sm disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-[350px]">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-4 h-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block pl-10 p-2.5 shadow-sm transition-colors"
            placeholder="Search vendor name, PAN.."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
          <Filter className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
          {["ALL", "APPROVED", "REQUESTED", "HOLD", "REJECTED", "BLOCKED"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as VendorStatus | "ALL")}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-full border transition-all shrink-0",
                filter === f
                  ? "bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              )}
            >
              {f === "ALL" ? "All Status" : f}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-500">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-100">
                <tr>
                  <th scope="col" className="px-6 py-4 font-semibold text-left whitespace-nowrap sticky left-0 bg-slate-50/80 z-10 shadow-[1px_0_0_0_#f1f5f9]">Actions</th>
                  <th scope="col" className="px-6 py-4 font-semibold whitespace-nowrap">S.No</th>
                  <th scope="col" className="px-6 py-4 font-semibold whitespace-nowrap">Vendor Name</th>
                  <th scope="col" className="px-6 py-4 font-semibold whitespace-nowrap">PAN</th>
                  <th scope="col" className="px-6 py-4 font-semibold whitespace-nowrap">GST</th>
                  <th scope="col" className="px-6 py-4 font-semibold whitespace-nowrap">Status</th>
                  <th scope="col" className="px-6 py-4 font-semibold whitespace-nowrap">Bank Name</th>
                  <th scope="col" className="px-6 py-4 font-semibold whitespace-nowrap">Account Number</th>
                  <th scope="col" className="px-6 py-4 font-semibold whitespace-nowrap">IFSC</th>
                  <th scope="col" className="px-6 py-4 font-semibold whitespace-nowrap">Registration Date</th>
                  <th scope="col" className="px-6 py-4 font-semibold whitespace-nowrap">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedVendors.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="px-6 py-12 text-center text-slate-500 border-b border-slate-100">
                      No vendors found matching your criteria.
                    </td>
                  </tr>
                ) : null}
                {paginatedVendors.map((vendor, index) => (
                  <tr
                    key={vendor.id}
                    className="bg-white hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => router.push(`/vendors/${vendor.id}`)}
                  >
                    <td className="px-6 py-4 text-left sticky left-0 bg-white group-hover:bg-slate-50 transition-colors z-10 shadow-[1px_0_0_0_#f1f5f9]">
                      <div className="flex justify-start">
                        <button
                          className="group/btn flex items-center text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-md whitespace-nowrap cursor-pointer transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/vendors/${vendor.id}`);
                          }}
                        >
                          Quick Validate
                          <ArrowRight className="w-3 h-3 ml-1.5 group-hover/btn:hidden" />
                          <Pointer className="w-3 h-3 ml-1.5 hidden group-hover/btn:block" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-medium">
                      {(currentPage - 1) * limit + index + 1}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                      {vendor.name}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600 text-sm whitespace-nowrap">
                      {vendor.pan}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600 text-sm whitespace-nowrap">
                      {vendor.gst}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={vendor.status}>{vendor.status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                      {vendor.bankName || "N/A"}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600 text-sm whitespace-nowrap">
                      {vendor.bankAccount}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600 text-sm whitespace-nowrap">
                      {vendor.ifsc}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm whitespace-nowrap">
                      {new Date(vendor.registeredDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm whitespace-nowrap">
                      {new Date(vendor.lastUpdated).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
        {filteredVendors.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 gap-4">
            <div className="flex items-center text-sm text-slate-500">
              <span className="mr-6 font-medium text-slate-700">
                {filteredVendors.length > 0 ? (currentPage - 1) * limit + 1 : 0}-{Math.min(currentPage * limit, filteredVendors.length)} of {filteredVendors.length}
              </span>
              <div className="flex items-center space-x-2">
                <span className="text-slate-500 hidden sm:inline">Rows per page:</span>
                <select
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="bg-white border border-slate-200 text-slate-700 text-sm rounded-md focus:ring-indigo-500 focus:border-indigo-500 py-1 px-2 shadow-sm outline-none"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded-md border border-slate-200 bg-white text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex space-x-1">
                {getPageNumbers().map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      "w-7 h-7 flex items-center justify-center rounded-md text-sm font-medium transition-colors",
                      currentPage === page
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded-md border border-slate-200 bg-white text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

"use client"

import { useState, useRef, useEffect } from "react"
import { Search, Download, ChevronLeft, ChevronRight, Filter, Calendar, CheckCircle, Clock, XCircle, FileText } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { Payment } from "@/lib/db"

interface VendorPaymentsClientProps {
  payments: Payment[]
  vendorName: string
  vendorIdString: string
}

export function VendorPaymentsClient({ payments, vendorName, vendorIdString }: VendorPaymentsClientProps) {
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [filterStatus, setFilterStatus] = useState<string>("ALL")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [showFilters, setShowFilters] = useState(false)

  // Scroll Sync Refs
  const topScrollRef = useRef<HTMLDivElement>(null)
  const bottomScrollRef = useRef<HTMLDivElement>(null)
  const tableRef = useRef<HTMLTableElement>(null)
  const [tableScrollWidth, setTableScrollWidth] = useState<number>(0)

  useEffect(() => {
    if (tableRef.current) {
      const observer = new ResizeObserver((entries) => {
        for (let entry of entries) {
          setTableScrollWidth(entry.target.scrollWidth)
        }
      })
      observer.observe(tableRef.current)
      return () => observer.disconnect()
    }
  }, [])

  const handleTopScroll = () => {
    if (bottomScrollRef.current && topScrollRef.current) {
      bottomScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft
    }
  }

  const handleBottomScroll = () => {
    if (topScrollRef.current && bottomScrollRef.current) {
      topScrollRef.current.scrollLeft = bottomScrollRef.current.scrollLeft
    }
  }

  const filteredPayments = payments.filter(p => {
    const matchesSearch = p.paymentId.toLowerCase().includes(search.toLowerCase()) ||
      p.invoiceNumber.toLowerCase().includes(search.toLowerCase())

    const matchesStatus = filterStatus === "ALL" || p.status === filterStatus

    let matchesDate = true
    if (startDate || endDate) {
      const pDate = new Date(p.createdAt).getTime()
      if (startDate && pDate < new Date(startDate).getTime()) matchesDate = false
      if (endDate && pDate > new Date(endDate).getTime() + 86400000) matchesDate = false
    }

    return matchesSearch && matchesStatus && matchesDate
  })

  const paginatedPayments = filteredPayments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED": return <CheckCircle className="w-4 h-4 text-emerald-500 mr-1.5" />
      case "PENDING": return <Clock className="w-4 h-4 text-amber-500 mr-1.5" />
      case "FAILED": return <XCircle className="w-4 h-4 text-red-500 mr-1.5" />
      default: return null
    }
  }

  const handleExport = () => {
    const headers = ["Payment ID", "Amount", "Invoice No.", "Status", "Date Initiated", "Remarks"];
    const csvContent = [
      headers.join(","),
      ...filteredPayments.map(p =>
        [
          p.paymentId,
          p.amount,
          `"${p.invoiceNumber}"`,
          p.status,
          new Date(p.createdAt).toLocaleDateString(),
          `"${p.remarks || ""}"`
        ].join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute("download", `payment_history_${vendorIdString}_${dateStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Payment History</h2>
          <p className="text-slate-500 mt-1">Transaction record for <span className="text-indigo-600 font-semibold">{vendorName}</span> ({vendorIdString})</p>
        </div>

        <button
          className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-lg text-sm font-medium shadow-sm transition-colors"
          onClick={handleExport}
        >
          <Download className="w-4 h-4" />
          Export History
        </button>
      </div>

      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative w-full sm:w-[350px]">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-4 h-4 text-slate-400" />
            </div>
            <input
              type="text"
              className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block pl-10 p-2.5 shadow-sm transition-colors"
              placeholder="Search Payment ID or Invoice..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setCurrentPage(1)
              }}
            />
          </div>
          <button
            className={cn(
              "flex items-center gap-2 border border-slate-200 px-3 py-2.5 rounded-lg text-sm font-medium shadow-sm transition-colors",
              showFilters ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-white text-slate-700 hover:bg-slate-50"
            )}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4" />
            Filters
            {(filterStatus !== "ALL" || startDate || endDate) && (
              <span className="flex h-2 w-2 rounded-full bg-indigo-600"></span>
            )}
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 animate-in fade-in slide-in-from-top-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1"><Filter className="w-3 h-3" /> Status</label>
              <select
                className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-md py-2 px-3 outline-none min-w-[150px]"
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="COMPLETED">Completed</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1"><Calendar className="w-3 h-3" /> Date Range</label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-md py-2 px-3 outline-none"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                />
                <span className="text-slate-400">to</span>
                <input
                  type="date"
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-md py-2 px-3 outline-none"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                />
              </div>
            </div>

            <div className="md:ml-auto flex items-end">
              <button
                onClick={() => {
                  setFilterStatus("ALL");
                  setStartDate("");
                  setEndDate("");
                  setSearch("");
                  setCurrentPage(1);
                }}
                className="text-sm font-medium text-slate-500 hover:text-slate-800 underline underline-offset-2 px-2 py-2"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        <Card className="overflow-hidden shadow-sm border-slate-200">
          <CardContent className="p-0">
            {/* TOP SCROLLBAR */}
            {tableScrollWidth > 0 && (
              <div
                ref={topScrollRef}
                onScroll={handleTopScroll}
                className="overflow-x-auto overflow-y-hidden"
              >
                <div style={{ width: `${tableScrollWidth}px`, height: '1px' }}></div>
              </div>
            )}

            <div
              ref={bottomScrollRef}
              className="overflow-x-auto"
              onScroll={handleBottomScroll}
            >
              <table ref={tableRef} className="w-full text-sm text-left text-slate-500">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 font-semibold whitespace-nowrap">Payment ID</th>
                    <th className="px-6 py-4 font-semibold whitespace-nowrap">Amount</th>
                    <th className="px-6 py-4 font-semibold whitespace-nowrap">Invoice No.</th>
                    <th className="px-6 py-4 font-semibold whitespace-nowrap">Status</th>
                    <th className="px-6 py-4 font-semibold whitespace-nowrap">Date Initiated</th>
                    <th className="px-6 py-4 font-semibold whitespace-nowrap">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedPayments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center opacity-40">
                          <FileText className="w-12 h-12 mb-2" />
                          <p>No payment records found matching your criteria.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedPayments.map((p) => (
                      <tr key={p.id} className="bg-white hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4 font-mono text-sm font-semibold text-indigo-600 whitespace-nowrap">
                          {p.paymentId}
                        </td>
                        <td className="px-6 py-4 font-mono font-medium text-slate-900 whitespace-nowrap">
                          ₹{p.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-600 whitespace-nowrap">
                          {p.invoiceNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={cn(
                            "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border",
                            p.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                              p.status === "PENDING" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                "bg-red-50 text-red-700 border-red-200"
                          )}>
                            {getStatusIcon(p.status)}
                            {p.status}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                          {new Date(p.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-slate-500 max-w-[200px] truncate" title={p.remarks || ""}>
                          {p.remarks || "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between py-3">
             <div className="text-sm text-slate-500">
                Showing <span className="font-medium text-slate-900">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="font-medium text-slate-900">{Math.min(currentPage * itemsPerPage, filteredPayments.length)}</span> of <span className="font-medium text-slate-900">{filteredPayments.length}</span> results
             </div>
             <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1 mx-2">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={cn(
                        "w-8 h-8 text-xs font-bold rounded-md transition-all",
                        currentPage === i + 1 
                          ? "bg-indigo-600 text-white shadow-sm" 
                          : "text-slate-600 hover:bg-slate-100"
                      )}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  )
}

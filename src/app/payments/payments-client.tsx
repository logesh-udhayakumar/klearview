"use client"

import { useState, useRef, useEffect } from "react"
import ReactDOM from "react-dom"
import { useRouter } from "next/navigation"
import { Plus, Search, CheckCircle, Clock, XCircle, Users, Trash2, Send, Download, ChevronLeft, ChevronRight, Settings, Filter, Calendar, X, AlertCircle, CheckCircle2, Info } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

import type { Payment, CreatePaymentDTO } from "@/lib/db"

interface PaymentsClientProps {
  initialPayments: Payment[]
  approvedVendors: { id: string; name: string; vendorId: string }[]
}

export function PaymentsClient({ initialPayments, approvedVendors }: PaymentsClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"REPORTS" | "INITIATE">("REPORTS")
  const [payments, setPayments] = useState<Payment[]>(initialPayments)

  // Reports State
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>("ALL")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [showFilters, setShowFilters] = useState(false)
  const [openActionId, setOpenActionId] = useState<string | null>(null)
  const [selectedPayment, setSelectedPayment] = useState<typeof payments[0] | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

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
  }, [activeTab])

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

  const scrollTable = (direction: 'left' | 'right') => {
    if (bottomScrollRef.current) {
      const amount = 300
      bottomScrollRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' })
    }
  }

  // Bulk / Action State
  const [selectedBulkId, setSelectedBulkId] = useState("")
  const [selectedBulkStatus, setSelectedBulkStatus] = useState("")
  const [isUpdatingBulk, setIsUpdatingBulk] = useState(false)
  const [updatingPaymentId, setUpdatingPaymentId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "SUCCESS" | "ERROR" | "INFO";
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "INFO"
  })

  // Helper for custom dialog
  const showFeedback = (title: string, message: string, type: "SUCCESS" | "ERROR" | "INFO") => {
    setFeedback({ isOpen: true, title, message, type })
  }

  // Initiation State
  const [draftPayments, setDraftPayments] = useState<CreatePaymentDTO[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCommonAmount, setIsCommonAmount] = useState(false)
  const [commonAmount, setCommonAmount] = useState(0)

  // Handlers for Reports
  const filteredPayments = payments.filter(p => {
    const matchesSearch = (p.vendor?.name || "").toLowerCase().includes(search.toLowerCase()) ||
      p.paymentId.toLowerCase().includes(search.toLowerCase()) ||
      p.invoiceNumber.toLowerCase().includes(search.toLowerCase())

    const matchesStatus = filterStatus === "ALL" || p.status === filterStatus

    let matchesDate = true
    if (startDate || endDate) {
      const pDate = new Date(p.createdAt).getTime()
      if (startDate && pDate < new Date(startDate).getTime()) matchesDate = false
      // Add 86400000 (24h) to make endDate inclusive
      if (endDate && pDate > new Date(endDate).getTime() + 86400000) matchesDate = false
    }

    return matchesSearch && matchesStatus && matchesDate
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED": return <CheckCircle className="w-4 h-4 text-emerald-500 mr-1.5" />
      case "PENDING": return <Clock className="w-4 h-4 text-amber-500 mr-1.5" />
      case "FAILED": return <XCircle className="w-4 h-4 text-red-500 mr-1.5" />
      default: return null
    }
  }

  const paginatedPayments = filteredPayments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage)

  const handleUpdateStatus = async (id: string, status: string) => {
    setUpdatingPaymentId(id)
    try {
      const res = await fetch('/api/payments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      })

      if (res.ok) {
        setPayments(payments.map(p => (p.id === id && p.status === "PENDING") ? { ...p, status: status as any } : p))
        router.refresh()
      } else {
        showFeedback("Update Failed", "Failed to update record status. Please try again.", "ERROR")
      }
    } catch (e) {
      showFeedback("Connection Error", "A network error occurred while updating status.", "ERROR")
    } finally {
      setUpdatingPaymentId(null)
    }
  }

  const handleBulkUpdate = async () => {
    if (!selectedBulkId || !selectedBulkStatus) return
    setIsUpdatingBulk(true)
    try {
      const res = await fetch('/api/payments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bulkId: selectedBulkId, status: selectedBulkStatus })
      })

      if (res.ok) {
        setPayments(payments.map(p => (p.bulkId === selectedBulkId && p.status === "PENDING") ? { ...p, status: selectedBulkStatus as any } : p))
        setSelectedBulkId("")
        setSelectedBulkStatus("")
        router.refresh()
        showFeedback("Bulk Update Success", "All eligible payments in the batch have been updated.", "SUCCESS")
      } else {
        showFeedback("Bulk Update Failed", "The server returned an error during bulk processing.", "ERROR")
      }
    } catch (e) {
      showFeedback("Unexpected Error", "An error occurred while communicating with the server.", "ERROR")
    } finally {
      setIsUpdatingBulk(false)
    }
  }

  const handleExport = () => {
    const headers = ["Payment ID", "Vendor ID", "Vendor Name", "Amount", "Invoice No.", "Status", "Date Initiated", "Remarks", "Bulk ID"];
    const csvContent = [
      headers.join(","),
      ...filteredPayments.map(p =>
        [
          p.paymentId,
          `"${p.vendor?.vendorId || ""}"`,
          `"${p.vendor?.name || "Unknown Vendor"}"`,
          p.amount,
          `"${p.invoiceNumber}"`,
          p.status,
          new Date(p.createdAt).toLocaleDateString(),
          `"${p.remarks || ""}"`,
          `"${p.bulkId || ""}"`
        ].join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute("download", `payment_reports_${dateStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const uniqueBulkIds = Array.from(new Set(
    payments
      .filter(p => p.status === "PENDING")
      .map(p => p.bulkId)
      .filter(Boolean)
  )) as string[];

  // Handlers for Initiation
  const addDraftPayment = () => {
    setDraftPayments([...draftPayments, { vendorId: "", amount: 0, invoiceNumber: "", remarks: "" }])
  }

  const loadAllApproved = () => {
    const drafts = approvedVendors.map(v => ({
      vendorId: v.id,
      amount: 0,
      invoiceNumber: "",
      remarks: "Bulk Payment"
    }))
    setDraftPayments(drafts)
  }

  const removeDraft = (index: number) => {
    setDraftPayments(draftPayments.filter((_, i) => i !== index))
  }

  const updateDraft = (index: number, field: keyof CreatePaymentDTO, value: string | number) => {
    const updated = [...draftPayments]
    updated[index] = { ...updated[index], [field]: value }
    setDraftPayments(updated)
  }

  const submitPayments = async () => {
    // Validate
    const invalid = draftPayments.some(d => !d.vendorId || (isCommonAmount ? commonAmount <= 0 : d.amount <= 0))
    if (invalid) {
      showFeedback("Validation Error", "Please ensure all rows have a selected vendor and a valid amount greater than zero.", "ERROR")
      return
    }

    const vendorIds = draftPayments.map(d => d.vendorId)
    const hasDuplicates = new Set(vendorIds).size !== vendorIds.length
    if (hasDuplicates) {
      showFeedback("Duplicate Vendors", "Double vendors detected! Each vendor can only be listed once per batch.", "ERROR")
      return
    }

    setIsSubmitting(true)
    try {
      const payload = draftPayments.map(d => ({
        ...d,
        amount: isCommonAmount ? commonAmount : d.amount
      }))

      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        showFeedback("Batch Initiated", "All payments have been successfully queued for processing.", "SUCCESS")
        setDraftPayments([])
        setActiveTab("REPORTS")
        router.refresh()
      } else {
        const err = await res.json()
        showFeedback("Initiation Failed", err.error || 'Failed to initiate payments. Please check your data.', "ERROR")
      }
    } catch (e) {
      showFeedback("System Error", "An unexpected error occurred while submitting payments.", "ERROR")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Payment Portal</h2>
          <p className="text-slate-500 mt-1">Manage vendor payments and view transaction reports</p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("REPORTS")}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-all",
              activeTab === "REPORTS" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Payment Reports
          </button>
          <button
            onClick={() => setActiveTab("INITIATE")}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-all",
              activeTab === "INITIATE" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Initiate Payment
          </button>
        </div>
      </div>

      {activeTab === "REPORTS" && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-[350px]">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="w-4 h-4 text-slate-400" />
              </div>
              <input
                type="text"
                className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block pl-10 p-2.5 shadow-sm transition-colors"
                placeholder="Search vendor name, Payment ID, Invoice..."
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

            <div className="flex items-center gap-3 bg-white p-2 border border-slate-200 rounded-lg shadow-sm w-full sm:w-auto overflow-x-auto shrink-0">
              <span className="text-sm font-medium text-slate-600 pl-2 whitespace-nowrap">Bulk Update:</span>
              <select
                title="Bulk ID"
                value={selectedBulkId}
                onChange={(e) => setSelectedBulkId(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-md py-1.5 px-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              >
                <option value="">Select Bulk ID</option>
                {uniqueBulkIds.map(id => (
                  <option key={id} value={id}>{id}</option>
                ))}
              </select>
              <select
                title="Status"
                value={selectedBulkStatus}
                onChange={(e) => setSelectedBulkStatus(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-md py-1.5 px-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              >
                <option value="">Select Status</option>
                <option value="COMPLETED">Completed</option>
                <option value="FAILED">Failed</option>
              </select>
              <button
                disabled={!selectedBulkId || !selectedBulkStatus || isUpdatingBulk}
                onClick={handleBulkUpdate}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isUpdatingBulk ? "Updating..." : "Update"}
              </button>
            </div>

            <button
              className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-lg text-sm font-medium shadow-sm transition-colors ml-auto shrink-0"
              onClick={handleExport}
            >
              <Download className="w-4 h-4" />
              Export Actions
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
                <label className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1"><Calendar className="w-3 h-3" /> Date Range (Created At)</label>
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



              {/* TOP SCROLLBAR — synced with the table below */}
              {tableScrollWidth > 0 && (
                <div
                  ref={topScrollRef}
                  onScroll={handleTopScroll}
                  style={{ overflowX: 'scroll', overflowY: 'hidden', width: '100%' }}
                >
                  <div style={{ width: `${tableScrollWidth}px`, height: '1px' }}></div>
                </div>
              )}



              {/* ACTUAL TABLE */}
              <div
                ref={bottomScrollRef}
                className="overflow-x-auto"
                onScroll={handleBottomScroll}
              >
                <table ref={tableRef} className="w-full text-sm text-left text-slate-500">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 font-semibold whitespace-nowrap">Payment ID</th>
                      <th className="px-6 py-4 font-semibold whitespace-nowrap">Vendor (ID)</th>
                      <th className="px-6 py-4 font-semibold whitespace-nowrap">Amount</th>
                      <th className="px-6 py-4 font-semibold whitespace-nowrap">Invoice No.</th>
                      <th className="px-6 py-4 font-semibold whitespace-nowrap">Status</th>
                      <th className="px-6 py-4 font-semibold whitespace-nowrap">Date Initiated</th>
                      <th className="px-6 py-4 font-semibold whitespace-nowrap">Remarks</th>
                      <th className="px-6 py-4 font-semibold whitespace-nowrap text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedPayments.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                          No payment transactions found.
                        </td>
                      </tr>
                    ) : (
                      paginatedPayments.map((p) => (
                        <tr key={p.id} className="bg-white hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4 font-mono text-sm whitespace-nowrap">
                            <button
                              onClick={() => setSelectedPayment(p)}
                              className="text-indigo-600 hover:text-indigo-800 hover:underline underline-offset-2 font-mono font-medium transition-colors cursor-pointer"
                            >
                              {p.paymentId}
                            </button>
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                            {p.vendor ? `${p.vendor.name} (${p.vendor.vendorId})` : "Unknown Vendor"}
                          </td>
                          <td className="px-6 py-4 font-mono font-medium text-slate-700 whitespace-nowrap">
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
                          <td className="px-6 py-4 text-slate-500 max-w-[150px] truncate" title={p.remarks || ""}>
                            {p.remarks || "-"}
                            {p.bulkId && <div className="text-xs text-slate-400 font-mono mt-0.5">{p.bulkId}</div>}
                          </td>
                          <td className="px-6 py-4 text-right overflow-visible">
                            {updatingPaymentId === p.id ? (
                              <div className="w-4 h-4 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin inline-block mr-2" />
                            ) : p.status === "PENDING" ? (
                              <div className="relative inline-block text-left">
                                <button
                                  onClick={() => setOpenActionId(openActionId === p.id ? null : p.id)}
                                  className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border shadow-sm",
                                    openActionId === p.id
                                      ? "bg-indigo-600 text-white border-indigo-700 ring-2 ring-indigo-100"
                                      : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                                  )}
                                >
                                  Action
                                  <ChevronRight className={cn("w-3.5 h-3.5 transition-transform", openActionId === p.id && "rotate-90")} />
                                </button>

                                {openActionId === p.id && (
                                  <>
                                    <div
                                      className="fixed inset-0 z-10"
                                      onClick={() => setOpenActionId(null)}
                                    />
                                    <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white border border-slate-200 shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                                      <div className="p-1 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 bg-slate-50/50">
                                        Update Status
                                      </div>
                                      <button
                                        onClick={() => {
                                          handleUpdateStatus(p.id, "COMPLETED");
                                          setOpenActionId(null);
                                        }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
                                      >
                                        <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                                          <CheckCircle className="w-3 h-3" />
                                        </div>
                                        Mark as Completed
                                      </button>
                                      <button
                                        onClick={() => {
                                          handleUpdateStatus(p.id, "FAILED");
                                          setOpenActionId(null);
                                        }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-red-700 hover:bg-red-50 transition-colors"
                                      >
                                        <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                                          <XCircle className="w-3 h-3" />
                                        </div>
                                        Mark as Failed
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400 inline-block px-2.5 py-1 bg-slate-50 rounded-md border border-slate-100 italic">
                                Finalized
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Pagination Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Rows per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="bg-white border border-slate-200 text-slate-700 text-sm rounded-md py-1 px-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-sm"
              >
                {[5, 10, 20, 50].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <span className="text-sm text-slate-500">
                <span className="font-medium text-slate-900">{filteredPayments.length === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="font-medium text-slate-900">{Math.min(currentPage * itemsPerPage, filteredPayments.length)}</span> of <span className="font-medium text-slate-900">{filteredPayments.length}</span>
              </span>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="flex items-center justify-center p-2 rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium text-slate-700 mx-1">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="flex items-center justify-center p-2 rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "INITIATE" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between bg-indigo-50/80 p-5 rounded-xl border border-indigo-100">
            <div className="flex-1 mr-4">
              <h3 className="text-indigo-900 font-semibold flex items-center gap-2">
                <Send className="w-4 h-4" />
                Initialize Transfer
              </h3>
              <p className="text-indigo-700/80 text-sm mt-1">
                Manually add vendors for payment or load all approved vendors at once for bulk processing.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <label className="flex items-center gap-2 text-sm text-indigo-700 bg-white border border-indigo-200 hover:bg-indigo-50 px-4 py-2 rounded-lg cursor-pointer transition-colors shadow-sm select-none whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={isCommonAmount}
                  onChange={(e) => setIsCommonAmount(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <span className="font-medium">Common Amount</span>
              </label>
              <button
                onClick={loadAllApproved}
                className="flex items-center gap-2 bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm whitespace-nowrap"
              >
                <Users className="w-4 h-4" />
                Load All Approved
              </button>
              <button
                onClick={addDraftPayment}
                className="flex items-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Add Payment Row
              </button>
            </div>
          </div>

          <Card className="shadow-sm border-slate-200">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Vendor</th>
                      <th className="px-4 py-3 font-semibold">Invoice No.</th>
                      <th className="px-4 py-3 font-semibold">Amount (₹)</th>
                      <th className="px-4 py-3 font-semibold">Remarks (Optional)</th>
                      <th className="px-4 py-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {draftPayments.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                          No payments added yet. Click &quot;Add Payment Row&quot; or &quot;Load All Approved&quot;.
                        </td>
                      </tr>
                    ) : (
                      draftPayments.map((draft, idx) => (
                        <tr key={idx} className="bg-white group">
                          <td className="p-3">
                            <select
                              value={draft.vendorId}
                              onChange={(e) => updateDraft(idx, "vendorId", e.target.value)}
                              className="w-full bg-white border border-slate-200 text-slate-700 rounded-md py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            >
                              <option value="" disabled>Select Vendor</option>
                              {approvedVendors.map(v => (
                                <option key={v.id} value={v.id}>{v.name} ({v.vendorId})</option>
                              ))}
                            </select>
                          </td>
                          <td className="p-3">
                            <input
                              type="text"
                              placeholder="INV00457"
                              value={draft.invoiceNumber}
                              onChange={(e) => updateDraft(idx, "invoiceNumber", e.target.value)}
                              className="w-full bg-white border border-slate-200 text-slate-700 rounded-md py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              value={isCommonAmount ? (commonAmount === 0 ? "" : commonAmount) : (draft.amount === 0 ? "" : draft.amount)}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0
                                if (isCommonAmount) {
                                  setCommonAmount(val)
                                } else {
                                  updateDraft(idx, "amount", val)
                                }
                              }}
                              className={cn(
                                "w-full bg-white border border-slate-200 text-slate-700 rounded-md py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono transition-colors",
                                isCommonAmount && "bg-slate-50 text-indigo-700 font-semibold"
                              )}
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="text"
                              placeholder="e.g. advance"
                              value={draft.remarks || ""}
                              onChange={(e) => updateDraft(idx, "remarks", e.target.value)}
                              className="w-full bg-white border border-slate-200 text-slate-700 rounded-md py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            />
                          </td>
                          <td className="p-3 w-10 text-center">
                            <button
                              onClick={() => removeDraft(idx)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {draftPayments.length > 0 && (
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                  <div className="text-sm text-slate-600 font-medium">
                    Total Amount: ₹<span className="text-slate-900 text-base ml-1">
                      {isCommonAmount
                        ? (commonAmount * draftPayments.length).toLocaleString('en-IN', { minimumFractionDigits: 2 })
                        : draftPayments.reduce((acc, curr) => acc + (curr.amount || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="ml-4 text-slate-500">|</span>
                    <span className="ml-4">Records: <span className="text-slate-900">{draftPayments.length}</span></span>
                  </div>
                  <button
                    onClick={submitPayments}
                    disabled={isSubmitting}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Submit Payments
                        <Send className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      {/* Payment Detail Dialog — rendered via portal to escape any CSS transform context */}
      {mounted && selectedPayment && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setSelectedPayment(null)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Header — sticky */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Payment Details</p>
                <h3 className="text-lg font-bold text-slate-900 font-mono">{selectedPayment.paymentId}</h3>
              </div>
              <button
                onClick={() => setSelectedPayment(null)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body — scrollable */}
            <div className="px-6 py-5 space-y-5 overflow-y-auto">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 font-medium">Status</span>
                <div className={cn(
                  "inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border",
                  selectedPayment.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                  selectedPayment.status === "PENDING" ? "bg-amber-50 text-amber-700 border-amber-200" :
                  "bg-red-50 text-red-700 border-red-200"
                )}>
                  {getStatusIcon(selectedPayment.status)}
                  {selectedPayment.status}
                </div>
              </div>

              <div className="border-t border-slate-100" />

              {/* Vendor Info */}
              <div>
                <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest mb-3">Vendor Information</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Vendor Name</p>
                    <p className="text-sm font-semibold text-slate-800">{selectedPayment.vendor?.name || "—"}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Vendor ID</p>
                    <p className="text-sm font-mono font-semibold text-indigo-600">{selectedPayment.vendor?.vendorId || "—"}</p>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div>
                <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest mb-3">Payment Information</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Amount</p>
                    <p className="text-sm font-mono font-bold text-slate-800">₹{selectedPayment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Invoice No.</p>
                    <p className="text-sm font-mono font-semibold text-slate-800">{selectedPayment.invoiceNumber || "—"}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Date Initiated</p>
                    <p className="text-sm font-semibold text-slate-800">{new Date(selectedPayment.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                  </div>
                  {selectedPayment.bulkId && (
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Bulk ID</p>
                      <p className="text-sm font-mono font-semibold text-slate-600">{selectedPayment.bulkId}</p>
                    </div>
                  )}
                  {selectedPayment.remarks && (
                    <div className="bg-slate-50 rounded-xl p-3 col-span-2">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Remarks</p>
                      <p className="text-sm text-slate-700">{selectedPayment.remarks}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer — sticky */}
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedPayment(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      , document.body)}
      {mounted && feedback.isOpen && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-200"
            onClick={() => setFeedback(f => ({ ...f, isOpen: false }))}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className={cn(
              "h-2 w-full",
              feedback.type === "SUCCESS" ? "bg-emerald-500" :
                feedback.type === "ERROR" ? "bg-red-500" :
                  "bg-indigo-500"
            )} />

            <div className="p-6 text-center">
              <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4",
                feedback.type === "SUCCESS" ? "bg-emerald-50 text-emerald-600" :
                  feedback.type === "ERROR" ? "bg-red-50 text-red-600" :
                    "bg-indigo-50 text-indigo-600"
              )}>
                {feedback.type === "SUCCESS" && <CheckCircle2 className="w-8 h-8" />}
                {feedback.type === "ERROR" && <AlertCircle className="w-8 h-8" />}
                {feedback.type === "INFO" && <Info className="w-8 h-8" />}
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-2">{feedback.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                {feedback.message}
              </p>

              <button
                onClick={() => setFeedback(f => ({ ...f, isOpen: false }))}
                className={cn(
                  "w-full py-3 rounded-xl font-semibold text-white shadow-lg transition-all active:scale-[0.98]",
                  feedback.type === "SUCCESS" ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200" :
                    feedback.type === "ERROR" ? "bg-red-600 hover:bg-red-700 shadow-red-200" :
                      "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200"
                )}
              >
                Continue
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { ShieldAlert, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface VendorStatusActionsProps {
  vendorId: string;
  vendorName: string;
  currentStatus: string;
  vendorGst?: string;
  vendorPan?: string;
}

export function VendorStatusActions({ vendorId, vendorName, currentStatus, vendorGst, vendorPan }: VendorStatusActionsProps) {
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  const [selectedStatus, setSelectedStatus] = useState("")
  const [holdType, setHoldType] = useState("")
  const [remarks, setRemarks] = useState("")

  useEffect(() => {
    setMounted(true)
  }, [])

  const getAvailableStatuses = (status: string) => {
    if (status === "REQUESTED") return ["HOLD", "REJECTED", "APPROVED", "BLOCKED"];
    if (status === "HOLD") return ["REJECTED", "BLOCKED", "APPROVED"];
    if (status === "APPROVED") return ["REJECTED", "BLOCKED"];
    return [];
  };

  const availableStatuses = getAvailableStatuses(currentStatus);

  const handleStatusChange = (newStatus: string) => {
    setSelectedStatus(newStatus);
    if (newStatus !== "HOLD") {
      setHoldType("");
      setRemarks("");
    }
  };

  const handleHoldTypeChange = (type: string) => {
    setHoldType(type);
    if (type === "GST Verification") {
      setRemarks(`This vendor profile is currently in the setup queue. Our compliance team is verifying the submitted documentation for GST (${vendorGst || "N/A"}).`);
    } else if (type === "PAN Verification") {
      setRemarks(`This vendor profile is currently in the setup queue. Our compliance team is verifying the submitted documentation for PAN (${vendorPan || "N/A"}).`);
    } else if (type === "Invalid Bank details") {
      setRemarks(`This vendor profile is currently in the setup queue. Our compliance team is verifying the submitted documentation for Bank details.`);
    } else {
      setRemarks("");
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedStatus) {
      alert("Please select an action status.");
      return;
    }

    if (selectedStatus === "HOLD" && !holdType) {
      alert("Please select a Hold Type.");
      return;
    }

    if (!remarks.trim()) {
      alert("Remarks are mandatory.");
      return;
    }

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/vendors/${vendorId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: selectedStatus,
          name: vendorName,
          remarks: remarks.trim()
        }),
      })

      if (response.ok) {
        setIsDialogOpen(false)
        router.refresh()
      } else {
        const data = await response.json()
        alert(data.error || "Failed to update status")
      }
    } catch (error) {
      console.error("Error updating status:", error)
      alert("An unexpected error occurred")
    } finally {
      setIsUpdating(false)
    }
  }

  if (currentStatus === "BLOCKED" || currentStatus === "REJECTED") return null;

  const modalContent = isDialogOpen ? (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-900">Take Action</h3>
          <button
            onClick={() => setIsDialogOpen(false)}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <label htmlFor="action-status" className="block text-sm font-medium text-slate-700">
              Action <span className="text-rose-500">*</span>
            </label>
            <select
              id="action-status"
              value={selectedStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
            >
              <option value="" disabled>Select Status...</option>
              {availableStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {selectedStatus === "HOLD" && (
            <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
              <label htmlFor="hold-type" className="block text-sm font-medium text-slate-700">
                Hold Type <span className="text-rose-500">*</span>
              </label>
              <select
                id="hold-type"
                value={holdType}
                onChange={(e) => handleHoldTypeChange(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
              >
                <option value="" disabled>Select Hold Type...</option>
                <option value="GST Verification">GST Verification</option>
                <option value="PAN Verification">PAN Verification</option>
                <option value="Invalid Bank details">Invalid Bank details</option>
                <option value="Others">Others</option>
              </select>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="action-remarks" className="block text-sm font-medium text-slate-700">
              Remarks <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="action-remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Provide reason for this action..."
              rows={4}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            />
          </div>
        </div>

        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={() => setIsDialogOpen(false)}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            disabled={isUpdating}
          >
            Cancel
          </button>
          <button
            onClick={handleStatusUpdate}
            disabled={isUpdating}
            className={cn(
              "px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 transition-colors cursor-pointer",
              isUpdating && "opacity-50 cursor-not-allowed"
            )}
          >
            {isUpdating ? "Processing..." : "Confirm Action"}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            setSelectedStatus("")
            setHoldType("")
            setRemarks("")
            setIsDialogOpen(true)
          }}
          disabled={isUpdating}
          className={cn(
            "flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-all shadow-sm text-sm font-medium cursor-pointer",
            isUpdating && "opacity-50 cursor-not-allowed"
          )}
        >
          <ShieldAlert className="w-4 h-4" />
          Take Action
        </button>
      </div>

      {mounted && typeof document !== 'undefined' && isDialogOpen
        ? createPortal(modalContent, document.body)
        : null}
    </>
  )
}

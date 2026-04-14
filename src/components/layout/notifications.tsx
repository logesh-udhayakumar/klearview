"use client"

import { useEffect, useState, useRef } from "react"
import { Bell, CheckCircle2, AlertTriangle, XCircle, Clock, ScrollText } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { AuditLog } from "@/lib/db"

export function Notifications({ vendorId, vendorName: InitialVendorName }: { vendorId?: string, vendorName?: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(false)
  const [resolvedVendorName, setResolvedVendorName] = useState(InitialVendorName)
  const [hasUnread, setHasUnread] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchLogs = async () => {
      let nameToUse = resolvedVendorName

      if (!nameToUse && vendorId) {
        try {
          const res = await fetch(`/api/vendors/${vendorId}`)
          const data = await res.json()
          nameToUse = data.name
          setResolvedVendorName(nameToUse)
        } catch (e) {
          console.error("Failed to resolve vendor name")
        }
      }

      if (!nameToUse) return

      setLoading(true)
      try {
        const res = await fetch(`/api/notifications?vendorName=${encodeURIComponent(nameToUse)}`)
        const data = await res.json()
        if (Array.isArray(data)) {
          setLogs(data)
          
          const key = `notifications_last_seen_${vendorId || resolvedVendorName || nameToUse}`
          
          // If open, mark as read immediately
          if (isOpen && data.length > 0) {
            localStorage.setItem(key, data[0].id)
            setHasUnread(false)
          } else if (data.length > 0) {
            // Background check for unread
            const lastSeenId = localStorage.getItem(key)
            if (lastSeenId !== data[0].id) {
              setHasUnread(true)
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [isOpen, InitialVendorName, vendorId])

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const getIcon = (type: string) => {
    switch (type) {
      case "SUCCESS": return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      case "ALERT": return <AlertTriangle className="h-4 w-4 text-amber-500" />
      case "ERROR": return <XCircle className="h-4 w-4 text-rose-500" />
      default: return <Clock className="h-4 w-4 text-slate-400" />
    }
  }

  return (
    <div className="relative mr-4" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-full transition-all duration-200 hover:bg-slate-100 group ${isOpen ? 'bg-slate-100' : ''}`}
      >
        <Bell className={`h-5 w-5 ${isOpen ? 'text-indigo-600' : 'text-slate-500 group-hover:text-indigo-600'}`} />
        {hasUnread && (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-0 mt-3 w-80 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <ScrollText className="h-4 w-4 text-indigo-500" />
                Audit Notifications
              </h3>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Latest Activities</span>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Fetching logs...</p>
                </div>
              ) : logs.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {logs.map((log) => (
                    <div key={log.id} className="p-4 hover:bg-slate-50/80 transition-colors group">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 shrink-0">
                          {getIcon(log.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 leading-snug group-hover:text-indigo-700 transition-colors">
                            {log.message}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(log.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell className="h-6 w-6 text-slate-300" />
                  </div>
                  <p className="text-sm font-medium text-slate-900">No activity yet</p>
                  <p className="text-xs text-slate-500 mt-1 px-4">Your audit history will appear here once validation begins.</p>
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50/50 border-t border-slate-100 text-center">
              <span className="text-[10px] text-slate-400 font-medium">Auto-updated on demand</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

"use client"

import { Sidebar } from "./sidebar"
import { Header } from "./header"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useState } from "react"
import { Building2, MousePointerClick, LogOut } from "lucide-react"

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<{ email: string; name?: string; user_type?: string; vendor_id?: string } | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)

  const isAuthPage = pathname === "/login" || pathname === "/signup"

  useEffect(() => {
    if (isAuthPage) {
      setIsLoaded(true)
      return
    }

    const storedUser = localStorage.getItem("user")
    let parsedUser = null
    if (storedUser) {
      try {
        parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
      } catch (e) {
        // ignore
      }
    }

    // Role-based logic
    if (parsedUser) {
      const isVendor = parsedUser.user_type?.toLowerCase() === "vendor"
      if (isVendor) {
        if (parsedUser.vendor_id) {
          // Mapped vendor, ensure they only access their specific profile
          const vendorPath = `/vendor-dashboard/${parsedUser.vendor_id}`
          if (!pathname.startsWith(vendorPath)) {
            router.push(vendorPath)
          }
        }
      }
    }

    setIsLoaded(true)
  }, [pathname, router, isAuthPage])

  // Inactivity timeout effect (10 minutes)
  useEffect(() => {
    if (isAuthPage || !user) return

    let timeoutId: NodeJS.Timeout

    const handleInactivity = () => {
      localStorage.removeItem("user")
      setUser(null)
      setSessionExpired(true)
    }

    const resetTimeout = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(handleInactivity, 10 * 60 * 1000) // 10 minutes in ms
    }

    resetTimeout()

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']
    events.forEach(event => document.addEventListener(event, resetTimeout))

    return () => {
      clearTimeout(timeoutId)
      events.forEach(event => document.removeEventListener(event, resetTimeout))
    }
  }, [isAuthPage, user])

  if (isAuthPage) {
    return <>{children}</>
  }

  // Prevent flash or incorrect rendering before auth checks are done
  if (!isLoaded) {
    return (
      <>
        <div className="flex h-screen bg-slate-50 items-center justify-center">
          <div className="animate-pulse flex items-center space-x-2 text-indigo-500 font-medium">
            Loading layout...
          </div>
        </div>
        <div className="hidden">{children}</div>
      </>
    )
  }

  const isVendor = user?.user_type?.toLowerCase() === "vendor"
  const isRegistrationPage = pathname === "/add-vendor"
  const needsProfile = isVendor && !user?.vendor_id && !isRegistrationPage

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <Sidebar user={user} />
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {needsProfile ? (
                <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto px-6 text-center">
                  <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm shadow-amber-200/50">
                    <Building2 className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Vendor Profile Needed</h2>
                  <p className="text-slate-500 mb-8 leading-relaxed">
                    You have successfully logged in, but your account is not yet mapped to a vendor ID. Please complete your registration to proceed.
                  </p>
                  <Link 
                    href="/add-vendor"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <MousePointerClick className="w-4 h-4 mr-2" />
                    Complete Registration
                  </Link>
                </div>
              ) : (
                children
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Session Expired Modal */}
      {sessionExpired && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center shadow-indigo-900/10"
          >
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm shadow-red-200/50">
              <LogOut className="w-8 h-8 ml-1" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Session Expired</h3>
            <p className="text-slate-500 mb-8 text-sm leading-relaxed">
              You have been inactive for 10 minutes. For your security, your session has been expired.
            </p>
            <button
              onClick={() => {
                setSessionExpired(false)
                router.push("/login")
              }}
              className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Login Again
            </button>
          </motion.div>
        </div>
      )}
    </div>
  )
}

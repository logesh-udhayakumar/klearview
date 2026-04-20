"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LogOut, User as UserIcon, ChevronRight, Search, Loader2, Menu } from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { Notifications } from "./notifications"
import { cn } from "@/lib/utils"

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<{ email: string; name?: string; user_type?: string; vendor_id?: string } | null>(null)
  const isVendor = user?.user_type?.toLowerCase() === "vendor"
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load simple user state from local storage
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        // ignore
      }
    }
  }, [pathname])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
        const data = await res.json()
        setSearchResults(data)
      } catch (err) {
        console.error(err)
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleLogout = () => {
    localStorage.removeItem("user")
    setUser(null)
    router.push("/login")
  }

  const getBreadcrumbs = () => {
    const paths = pathname.split('/').filter(p => p)
    const crumbs = [{ name: 'Home', href: '/dashboard' }]
    
    paths.forEach((p, i) => {
      // Don't add dashboard to crumbs if it's already there (it will be after Home)
      if (p.toLowerCase() === 'dashboard') return;
      
      const name = p.charAt(0).toUpperCase() + p.slice(1).replace(/-/g, ' ')
      const href = '/' + paths.slice(0, i + 1).join('/')
      crumbs.push({ name, href })
    })

    return crumbs
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-4 sm:px-6 z-10 shrink-0">
      <div className="flex items-center gap-4 lg:gap-8">
        {/* Mobile menu button */}
        <button
          type="button"
          className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-md transition-colors"
          onClick={onMenuClick}
        >
          <Menu className="w-5 h-5" />
        </button>
        {/* Breadcrumbs - hidden for vendors */}
        {!isVendor && (
          <nav className="hidden lg:flex items-center gap-2 text-sm font-medium">
            {breadcrumbs.map((crumb, i) => (
              <div key={crumb.href} className="flex items-center gap-2">
                {i > 0 && <ChevronRight className="w-4 h-4 text-slate-300" />}
                <Link 
                  href={crumb.href}
                  className={i === breadcrumbs.length - 1 ? "text-indigo-600 font-semibold" : "text-slate-500 hover:text-slate-900 transition-colors"}
                >
                  {crumb.name}
                </Link>
              </div>
            ))}
          </nav>
        )}

        {/* Global Search - hidden for vendors */}
        {!isVendor && (
          <div className="hidden md:flex items-center relative" ref={searchRef}>
            {isSearching ? (
              <Loader2 className="absolute left-3 w-4 h-4 text-indigo-500 animate-spin" />
            ) : (
              <Search className="absolute left-3 w-4 h-4 text-slate-400" />
            )}
            <input 
              type="text" 
              placeholder="Search vendors or payments..." 
              className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none w-48 lg:w-64 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
            />

            {isSearchFocused && (searchQuery.length >= 2 || isSearching) && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden min-w-[320px] lg:min-w-[400px]">
                <div className="p-2 max-h-[400px] overflow-y-auto">
                  {isSearching && searchResults.length === 0 && (
                    <div className="px-4 py-8 text-center bg-slate-50/50 rounded-lg">
                      <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mx-auto mb-2" />
                      <p className="text-xs text-slate-500 font-medium">Searching across records...</p>
                    </div>
                  )}
                  
                  {!isSearching && searchResults.length === 0 && (
                    <div className="px-4 py-8 text-center bg-slate-50/50 rounded-lg">
                      <p className="text-sm font-semibold text-slate-900 mb-1">No results found</p>
                      <p className="text-xs text-slate-500">We couldn't find anything matching "{searchQuery}"</p>
                    </div>
                  )}

                  {searchResults.length > 0 && (
                    <div className="space-y-1">
                      {/* Groups by type */}
                      {['Vendor', 'Payment'].map(type => {
                        const items = searchResults.filter(r => r.type === type)
                        if (items.length === 0) return null
                        
                        return (
                          <div key={type} className="pb-2 last:pb-0">
                            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 rounded-md mb-1 flex justify-between items-center">
                              <span>{type}s</span>
                              <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full text-[9px]">{items.length}</span>
                            </div>
                            {items.map(result => (
                              <Link
                                key={`${result.type}-${result.id}`}
                                href={result.href}
                                className="flex items-center gap-3 p-2.5 hover:bg-indigo-50 rounded-lg transition-all group"
                                onClick={() => {
                                  setIsSearchFocused(false)
                                  setSearchQuery("")
                                }}
                              >
                                <div className={cn(
                                  "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border transition-colors",
                                  result.type === 'Vendor' 
                                    ? "bg-indigo-50 text-indigo-600 border-indigo-100 group-hover:bg-indigo-100 group-hover:border-indigo-200" 
                                    : "bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-100 group-hover:border-emerald-200"
                                )}>
                                  {result.type === 'Vendor' ? <UserIcon size={18} /> : <div className="font-bold text-xs">$</div>}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                                    {result.title}
                                  </p>
                                  <p className="text-xs text-slate-500 truncate mt-0.5 font-medium">
                                    {result.subtitle}
                                  </p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transform group-hover:translate-x-0.5 transition-all" />
                              </Link>
                            ))}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <p className="text-[10px] text-slate-400 italic">Press ESC to close</p>
                  <div className="flex gap-1.5">
                     <kbd className="px-1.5 py-0.5 text-[9px] font-semibold text-slate-500 bg-white border border-slate-200 rounded-md shadow-sm">↵</kbd>
                     <span className="text-[10px] text-slate-400 font-medium">to select</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {user ? (
        <div className="flex items-center gap-3">
          {user.user_type?.toLowerCase() === "vendor" && (
            <Notifications vendorId={user.vendor_id} />
          )}

          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center group gap-3 hover:bg-slate-50 p-2 rounded-lg transition-colors focus:outline-none"
            >
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium text-slate-900 leading-tight">
                  {user.name || "User"}
                </span>
                <span className="text-xs text-slate-500 capitalize">{user.user_type}</span>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 transition-colors group-hover:bg-indigo-200 shadow-sm border border-indigo-200">
                <UserIcon className="h-5 w-5" />
              </div>
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user.name || 'User'}</p>
                  <p className="text-[10px] text-slate-500 truncate uppercase tracking-wider">{user.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 flex items-center transition-colors font-medium border-t border-slate-100"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <Link
          href="/login"
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
        >
          Log in
        </Link>
      )}
    </header>
  )
}

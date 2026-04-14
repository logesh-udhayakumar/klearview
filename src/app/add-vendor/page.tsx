"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Check, ChevronRight, User, Building, Landmark, ShieldCheck, CheckCircle2, ArrowLeft } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const steps = [
  { id: 1, name: "Vendor Identity", icon: Building },
  { id: 2, name: "Banking Details", icon: Landmark },
]

export default function AddVendor() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)

  // Form State
  const [nextVendorId, setNextVendorId] = useState("VND-...")
  const [name, setName] = useState("")
  const [pan, setPan] = useState("")
  const [gst, setGst] = useState("")
  const [ifsc, setIfsc] = useState("")
  const [bankAccount, setBankAccount] = useState("")
  const [bankName, setBankName] = useState("")

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<{ email: string; user_type?: string; vendor_id?: string } | null>(null)

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (err) {
        console.error("Failed to parse user from localStorage", err)
      }
    }
  }, [])

  const isVendor = user?.user_type?.toLowerCase() === "vendor"

  useEffect(() => {
    const fetchNextId = async () => {
      try {
        const response = await fetch("/api/vendors")
        if (response.ok) {
          const data = await response.json()
          setNextVendorId(`VND-${String((data.count || 0) + 1).padStart(3, '0')}`)
        }
      } catch (err) {
        console.error("Failed to fetch next vendor ID", err)
      }
    }
    fetchNextId()
  }, [])

  // Micro-validations
  const isNameValid = name.length >= 3
  const isPanValid = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan) && pan.length > 0
  const isGstValid = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gst) && gst.length > 0
  const isIfscValid = /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc) && ifsc.length > 0
  const isBankAccountValid = bankAccount.length >= 8
  const isBankNameValid = bankName.length >= 3

  const handleSubmit = async () => {
    if (!isNameValid || !isPanValid || !isGstValid || !isIfscValid || !isBankAccountValid || !isBankNameValid) {
      setError("Please fill all mandatory fields correctly before submitting.")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const isVendor = user?.user_type?.toLowerCase() === "vendor"
      const registrationStatus = isVendor ? "REQUESTED" : "HOLD"

      const response = await fetch("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          pan,
          gst,
          ifsc,
          bankAccount,
          bankName,
          status: registrationStatus,
          userEmail: user?.email,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to create vendor")
      }

      const createdVendor = await response.json()

      // Update local storage if it was the logged-in vendor registering themselves
      if (user && isVendor) {
        const updatedUser = { ...user, vendor_id: createdVendor.vendorId }
        localStorage.setItem("user", JSON.stringify(updatedUser))

        // Success - redirect to their new dashboard
        router.push(`/vendor-dashboard/${createdVendor.id}`)
      } else {
        // Success - redirect to vendors list (Admin flow)
        router.push("/vendors")
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 max-w-5xl mx-auto w-full">
      <div className="mb-8">
        {!isVendor && (
          <button
            onClick={() => router.back()}
            className="group mb-4 flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Reports
          </button>
        )}
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Vendor Registration</h2>
        <p className="text-slate-500 mt-1">Onboard new vendor entity creation</p>
      </div>

      {/* Stepper Progress */}
      <div className="mb-10">
        <nav aria-label="Progress">
          <ol role="list" className="flex items-center space-x-2 md:space-x-4">
            {steps.map((step, index) => {
              const isActive = currentStep === step.id
              const isComplete = currentStep > step.id

              return (
                <li key={step.name} className="flex-1">
                  <div className={cn(
                    "group flex flex-col border-t-4 pt-4 transition-colors",
                    isComplete ? "border-indigo-600" : isActive ? "border-indigo-600" : "border-slate-200"
                  )}>
                    <span className="flex items-center text-sm font-semibold">
                      <span className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 mr-3",
                        isComplete ? "border-indigo-600 bg-indigo-600 text-white" : isActive ? "border-indigo-600 text-indigo-600 border-2" : "border-slate-300 text-slate-400"
                      )}>
                        {isComplete ? <Check className="h-4 w-4" /> : <step.icon className="h-4 w-4" />}
                      </span>
                      <span className={cn(
                        "transition-colors",
                        isComplete ? "text-slate-900" : isActive ? "text-indigo-600" : "text-slate-500"
                      )}>
                        {step.name}
                      </span>
                    </span>
                  </div>
                </li>
              )
            })}
          </ol>
        </nav>
      </div>

      <Card className="shadow-sm max-w-3xl mx-auto border-slate-200 ring-1 ring-slate-100">
        <CardContent className="p-8 sm:p-10">

          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-slate-900">Vendor Identity Parameters</h3>
                <p className="text-sm text-slate-500 mt-1">Provide the legal identification markers for this vendor.</p>
              </div>

              <div className="flex flex-col mb-6">
                <label className="text-sm font-medium text-slate-700 mb-1.5">
                  Vendor ID (Auto-generated)
                </label>
                <div className="relative group">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    type="text"
                    value={nextVendorId}
                    readOnly
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 p-2.5 text-slate-500 font-mono font-semibold cursor-not-allowed shadow-inner"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-bold uppercase border border-indigo-100">Immutable</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-2 ml-1 flex items-center">
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  This unique identifier is assigned sequentially by the Klear View core system.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-slate-700 mb-1.5 flex justify-between">
                    Vendor(Legal) Name
                    {name.length > 0 && (
                      <span className={cn("text-xs flex items-center", isNameValid ? "text-emerald-600" : "text-amber-600")}>
                        {isNameValid ? <><CheckCircle2 className="h-3 w-3 mr-1" /> Valid</> : "Min 3 chars"}
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={cn(
                      "w-full bg-white border rounded-lg p-2.5 shadow-sm outline-none transition-colors",
                      name.length === 0 ? "border-slate-300 focus:ring-2 focus:ring-indigo-500" :
                        isNameValid ? "border-emerald-500 focus:ring-2 focus:ring-emerald-500" : "border-amber-400 focus:ring-2 focus:ring-amber-400"
                    )}
                    placeholder="e.g. Acme Corporation Pvt Ltd"
                  />
                </div>

                <div className="flex flex-col relative">
                  <label className="text-sm font-medium text-slate-700 mb-1.5 flex justify-between items-center">
                    PAN Number
                    {pan.length > 0 && (
                      <span className={cn("text-xs flex items-center", isPanValid ? "text-emerald-600" : "text-amber-600")}>
                        {isPanValid ? <><CheckCircle2 className="h-3 w-3 mr-1" /> Format Valid</> : pan.length < 10 ? "Incomplete..." : "Invalid format"}
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={pan}
                    onChange={(e) => setPan(e.target.value.toUpperCase())}
                    className={cn(
                      "w-full bg-white border rounded-lg p-2.5 shadow-sm outline-none font-mono uppercase transition-colors",
                      pan.length === 0 ? "border-slate-300 focus:ring-2 focus:ring-indigo-500" :
                        isPanValid ? "border-emerald-500 focus:ring-2 focus:ring-emerald-500" : "border-amber-400 focus:ring-2 focus:ring-amber-400"
                    )}
                    placeholder="ABCDE1234F"
                    maxLength={10}
                  />
                </div>

                <div className="flex flex-col relative">
                  <label className="text-sm font-medium text-slate-700 mb-1.5 flex justify-between items-center">
                    GSTIN
                    {gst.length > 0 && (
                      <span className={cn("text-xs flex items-center", isGstValid ? "text-emerald-600" : "text-amber-600")}>
                        {isGstValid ? <><CheckCircle2 className="h-3 w-3 mr-1" /> Checksum Valid</> : "Invalid layout"}
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={gst}
                    onChange={(e) => setGst(e.target.value.toUpperCase())}
                    className={cn(
                      "w-full bg-white border rounded-lg p-2.5 shadow-sm outline-none font-mono uppercase transition-colors",
                      gst.length === 0 ? "border-slate-300 focus:ring-2 focus:ring-indigo-500" :
                        isGstValid ? "border-emerald-500 focus:ring-2 focus:ring-emerald-500" : "border-amber-400 focus:ring-2 focus:ring-amber-400"
                    )}
                    placeholder="27ABCDE1234F1Z5"
                    maxLength={15}
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-slate-900">Banking Validation</h3>
                <p className="text-sm text-slate-500 mt-1">Ensure routing details match the central reserve system.</p>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-slate-700 mb-1.5 flex justify-between">
                    Beneficiary Bank Name
                    {bankName.length > 0 && (
                      <span className={cn("text-xs flex items-center", isBankNameValid ? "text-emerald-600" : "text-amber-600")}>
                        {isBankNameValid ? <><CheckCircle2 className="h-3 w-3 mr-1" /> Valid</> : "Min 3 chars"}
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className={cn(
                      "w-full bg-white border border-slate-300 rounded-lg p-2.5 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none",
                      bankName.length === 0 ? "border-slate-300 focus:ring-2 focus:ring-indigo-500" :
                        isBankNameValid ? "border-emerald-500 focus:ring-2 focus:ring-emerald-500" : "border-amber-400 focus:ring-2 focus:ring-amber-400"
                    )}
                    placeholder="e.g. HDFC Bank"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-medium text-slate-700 mb-1.5 flex justify-between">
                    Account Number
                    {bankAccount.length > 0 && (
                      <span className={cn("text-xs flex items-center", isBankAccountValid ? "text-emerald-600" : "text-amber-600")}>
                        {isBankAccountValid ? <><CheckCircle2 className="h-3 w-3 mr-1" /> Valid</> : "Min 8 digits"}
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value.replace(/\D/g, ""))}
                    placeholder="Account Number"
                    className={cn(
                      "w-full bg-white border rounded-lg p-2.5 shadow-sm outline-none font-mono transition-colors",
                      bankAccount.length === 0 ? "border-slate-300 focus:ring-2 focus:ring-indigo-500" :
                        isBankAccountValid ? "border-emerald-500 focus:ring-2 focus:ring-emerald-500" : "border-amber-400 focus:ring-2 focus:ring-amber-400"
                    )}
                  />
                </div>

                <div className="flex flex-col relative">
                  <label className="text-sm font-medium text-slate-700 mb-1.5 flex justify-between items-center">
                    IFSC Routing Code
                    {ifsc.length > 0 && (
                      <span className={cn("text-xs flex items-center", isIfscValid ? "text-emerald-600" : "text-amber-600")}>
                        {isIfscValid ? <><CheckCircle2 className="h-3 w-3 mr-1" /> Valid Pattern</> : "Must be 11 chars, 5th is 0"}
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={ifsc}
                    onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                    className={cn(
                      "w-full bg-white border rounded-lg p-2.5 shadow-sm outline-none font-mono uppercase transition-colors",
                      ifsc.length === 0 ? "border-slate-300 focus:ring-2 focus:ring-indigo-500" :
                        isIfscValid ? "border-emerald-500 focus:ring-2 focus:ring-emerald-500" : "border-amber-400 focus:ring-2 focus:ring-amber-400"
                    )}
                    placeholder="HDFC0001234"
                    maxLength={11}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700 text-sm animate-in fade-in slide-in-from-top-2">
              <ShieldCheck className="w-4 h-4 mr-2 shrink-0" />
              {error}
            </div>
          )}

          {/* Controls */}
          <div className="mt-10 flex items-center justify-between border-t border-slate-100 pt-6">
            <button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1 || isSubmitting}
              className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous Step
            </button>

            {currentStep < 2 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 flex items-center rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Continue Setup
                <ChevronRight className="w-4 h-4 ml-1.5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={cn(
                  "px-6 py-2.5 text-sm font-medium text-white flex items-center rounded-lg transition-all shadow-sm",
                  isSubmitting ? "bg-slate-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700"
                )}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Storing Profile...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Submit
                  </>
                )}
              </button>
            )}
          </div>

        </CardContent>
      </Card>
    </div>
  )
}

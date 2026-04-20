import { CheckCircle2, XCircle, AlertTriangle, ExternalLink, Calendar, Building, Landmark, Focus, ShieldCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getVendorById } from "@/lib/db"
import Link from "next/link"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic";

export default async function VendorDashboard({ params }: { params: Promise<{ id: string }> }) {
  const { id: vendorId } = await params;
  
  const vendor = await getVendorById(vendorId)

  if (!vendor) {
    notFound();
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-7xl mx-auto">
      <div className="flex items-center space-x-4 mb-2">
        <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 shadow-sm border border-indigo-100">
          <Building className="h-6 w-6" />
        </div>
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">{vendor.name}</h2>
            <Badge variant={vendor.status} className="mt-1">{vendor.status}</Badge>
          </div>
          <p className="text-slate-500 mt-1 cursor-default text-sm">Welcome to your dashboard • Profile last synced {new Date(vendor.lastUpdated).toLocaleString()}</p>
        </div>
      </div>

      {vendor.status === "HOLD" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start shadow-sm ring-1 ring-amber-500/20">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-semibold text-amber-800">Review Required: Identity Verification Flag</h3>
            <p className="mt-1 text-sm text-amber-700">
               We encountered an overlap with your GST ({vendor.gst}) matching other records in our centralized system. 
               Your profile requires manual review by our administration team. Please reach out to your point of contact or support to expedite this.
            </p>
          </div>
        </div>
      )}

      {vendor.status === "REJECTED" && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 flex items-start shadow-sm ring-1 ring-rose-500/20">
          <XCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-semibold text-rose-800">Compliance Rejection</h3>
            <p className="mt-1 text-sm text-rose-700">
               Unfortunately, your registration details could not be validated against external registries. Please update your compliance documents or contact support.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Pane - Profile */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
              <CardTitle className="text-base font-semibold flex items-center text-slate-800">
                <ShieldCheck className="h-4 w-4 mr-2 text-slate-500" />
                Your Identity Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 px-6 pb-6 space-y-5">
              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">Legal Entity Name</dt>
                <dd className="mt-1 text-sm font-medium text-slate-900 shadow-sm border border-slate-200 rounded-md py-1.5 px-3 bg-slate-50">{vendor.name}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">PAN (Permanent Account Number)</dt>
                <dd className="mt-1 text-sm font-medium text-slate-900 shadow-sm border border-slate-200 rounded-md py-1.5 px-3 bg-slate-50">{vendor.pan}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">GSTIN</dt>
                <dd className="mt-1 text-sm font-medium text-slate-900 shadow-sm border border-slate-200 rounded-md py-1.5 px-3 bg-slate-50">{vendor.gst}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center">
                  <Calendar className="h-3 w-3 mr-1" /> Registration Date
                </dt>
                <dd className="mt-1 text-sm text-slate-700">{new Date(vendor.registeredDate).toLocaleDateString()}</dd>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
              <CardTitle className="text-base font-semibold flex items-center text-slate-800">
                <Landmark className="h-4 w-4 mr-2 text-slate-500" />
                Banking Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 px-6 pb-6 space-y-5">
              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">Beneficiary Account</dt>
                <dd className="mt-1 text-sm font-mono font-medium text-slate-900 bg-slate-100 rounded px-2 py-1 inline-block">
                  ***{vendor.bankAccount.slice(-4)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">Routing / IFSC</dt>
                <dd className="mt-1 text-sm font-medium text-slate-900 shadow-sm border border-slate-200 rounded-md py-1.5 px-3 bg-slate-50">{vendor.ifsc}</dd>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Pane - Validation Engine Checks */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="h-full border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 space-y-0 flex flex-row items-center justify-between py-4">
              <CardTitle className="text-lg font-bold flex items-center">
                <Focus className="h-5 w-5 text-indigo-500 mr-2" />
                Compliance Verification Status
              </CardTitle>
              <span className="text-sm font-medium text-slate-500">Trust Score: {vendor.score}/100</span>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-slate-100">
                
                {/* Rule 1: PAN validation */}
                <li className="flex items-start p-5 hover:bg-slate-50 transition-colors">
                  <div className="flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div className="ml-4 flex-1">
                    <h4 className="text-sm font-medium text-slate-900">PAN Structural Validation</h4>
                    <p className="mt-1 text-sm text-slate-500">Your Permanent Account Number conforms to required regulatory formatting.</p>
                  </div>
                  <div className="ml-4 text-xs font-mono text-emerald-600 bg-emerald-50 px-2 py-1 rounded">PASS</div>
                </li>

                {/* Rule 2: GST Verification */}
                <li className="flex items-start p-5 hover:bg-slate-50 transition-colors">
                  <div className="flex-shrink-0 mt-0.5">
                    {vendor.status === "REJECTED" ? (
                      <XCircle className="h-5 w-5 text-rose-500" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    )}
                  </div>
                  <div className="ml-4 flex-1">
                    <h4 className="text-sm font-medium text-slate-900">GSTIN Registry Check</h4>
                    <p className="mt-1 text-sm text-slate-500">Verified status of your GSTIN with the centralized government registry.</p>
                    {vendor.status === "REJECTED" && (
                        <div className="mt-2 text-xs text-rose-700 bg-rose-50 p-2 border border-rose-100 rounded-md">
                          Error: We could not confidently resolve your GSTIN as active.
                        </div>
                    )}
                  </div>
                  <div className="ml-4 text-xs font-mono">
                    {vendor.status === "REJECTED" ? (
                      <span className="text-rose-600 bg-rose-50 px-2 py-1 rounded">FAIL</span>
                    ) : (
                      <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded">PASS</span>
                    )}
                  </div>
                </li>

                {/* Rule 3: IFSC Verification */}
                <li className="flex items-start p-5 hover:bg-slate-50 transition-colors">
                  <div className="flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div className="ml-4 flex-1">
                    <h4 className="text-sm font-medium text-slate-900">Banking Routing Verification</h4>
                    <p className="mt-1 text-sm text-slate-500">Your designated beneficiary bank branch is verified active.</p>
                  </div>
                  <div className="ml-4 text-xs font-mono text-emerald-600 bg-emerald-50 px-2 py-1 rounded">PASS</div>
                </li>

                {/* Rule 4: Duplicate Checks */}
                <li className="flex items-start p-5 hover:bg-slate-50 transition-colors">
                  <div className="flex-shrink-0 mt-0.5">
                    {vendor.status === "HOLD" ? (
                      <XCircle className="h-5 w-5 text-amber-500" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    )}
                  </div>
                  <div className="ml-4 flex-1">
                    <h4 className="text-sm font-medium text-slate-900">System Uniqueness Check</h4>
                    <p className="mt-1 text-sm text-slate-500">Ensures no duplicate profiles exist across our internal database.</p>
                    {vendor.status === "HOLD" && (
                        <div className="mt-2 text-xs text-amber-700 bg-amber-50 p-2 border border-amber-100 rounded-md">
                          Flag: Potential matching parameters detected. Pending assessment.
                        </div>
                    )}
                  </div>
                  <div className="ml-4 text-xs font-mono">
                    {vendor.status === "HOLD" ? (
                      <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded">WARN</span>
                    ) : (
                      <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded">PASS</span>
                    )}
                  </div>
                </li>

              </ul>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}

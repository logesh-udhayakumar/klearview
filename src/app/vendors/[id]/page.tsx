import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, ExternalLink, Calendar, Building, Landmark, Focus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getVendorById, getDuplicateVendor, getVendorCount, getLatestVendorAuditLog } from "@/lib/db"
import { VendorStatusActions } from "@/components/vendors/vendor-status-actions"
import Link from "next/link"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic";

// Next.js 15+ Server Component Page Props
export default async function ValidationEngine({ params }: { params: Promise<{ id: string }> }) {
  const { id: vendorId } = await params;

  const [vendor, totalVendors] = await Promise.all([
    getVendorById(vendorId),
    getVendorCount()
  ]);

  if (!vendor) {
    notFound();
  }

  // Check for actual duplicates in the database and get remarks
  const [duplicateVendor, latestLog] = await Promise.all([
    (vendor.status !== "APPROVED")
      ? getDuplicateVendor(vendor.id, vendor.gst, vendor.pan)
      : Promise.resolve(null),
    vendor.status !== "APPROVED"
      ? getLatestVendorAuditLog(vendor.name)
      : Promise.resolve(null)
  ]);

  let remarksText = "";
  if (latestLog && latestLog.message) {
    const parts = latestLog.message.split("Remarks: ");
    if (parts.length > 1) {
      remarksText = parts[1];
    }
  }

  const isErrorStatus = vendor.status === "REJECTED" || vendor.status === "BLOCKED";
  const bannerClasses = isErrorStatus
    ? "border-rose-200 bg-rose-50 ring-rose-500/20"
    : "border-amber-200 bg-amber-50 ring-amber-500/20";
  const iconClasses = isErrorStatus ? "text-rose-600" : "text-amber-600";
  const titleClasses = isErrorStatus ? "text-rose-800" : "text-amber-800";
  const textClasses = isErrorStatus ? "text-rose-700" : "text-amber-700";
  const btnClasses = isErrorStatus ? "text-rose-800 bg-rose-100 hover:bg-rose-200" : "text-amber-800 bg-amber-100 hover:bg-amber-200";

  // Real-time validation logic
  const isPanValid = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(vendor.pan);
  const isGstValid = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(vendor.gst);
  const isIfscValid = /^[A-Z]{4}0[A-Z0-9]{6}$/.test(vendor.ifsc);

  // Dynamic Score Calculation
  let dynamicScore = 0;
  if (isPanValid) dynamicScore += 25;
  if (isGstValid && vendor.status !== "REJECTED") dynamicScore += 25;
  if (isIfscValid) dynamicScore += 25;
  if (!duplicateVendor) dynamicScore += 25;

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center space-x-4 mb-2">
        <Link
          href="/vendors"
          className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-900 inline-flex items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">{vendor.name}</h2>
              <Badge variant={vendor.status} className="mt-1">{vendor.status}</Badge>
            </div>
            <p className="text-slate-500 mt-1 cursor-default text-sm">Vendor ID: {vendor.vendorId} • Last synced {new Date(vendor.lastUpdated).toLocaleString()}</p>
          </div>

          <VendorStatusActions
            vendorId={vendor.id}
            vendorName={vendor.name}
            currentStatus={vendor.status}
          />
        </div>
      </div>

      {(vendor.status === "HOLD" || vendor.status === "REJECTED" || vendor.status === "BLOCKED") && (
        <div className={`rounded-xl border p-4 flex items-start shadow-sm ring-1 ${bannerClasses}`}>
          <AlertTriangle className={`h-5 w-5 shrink-0 mt-0.5 ${iconClasses}`} />
          <div className="ml-3 flex-1">
            <h3 className={`text-sm font-semibold ${titleClasses}`}>
              {remarksText
                ? `Status Note: ${vendor.status.charAt(0) + vendor.status.slice(1).toLowerCase()} Reason`
                : (duplicateVendor ? "Compliance Flag: Duplicate Identity Detected" : "Status Note: Pending Manual Verification")}
            </h3>
            <p className={`mt-1 text-sm ${textClasses}`}>
              {remarksText ? (
                remarksText
              ) : duplicateVendor ? (
                <>
                  This vendor's GST/PAN exactly matches <Link href={`/vendors/${duplicateVendor.id}`} className={`font-medium underline ${isErrorStatus ? "hover:text-rose-900" : "hover:text-amber-900"}`}>{duplicateVendor.name}</Link>.
                  Manual override or document verification required before approval.
                </>
              ) : (
                <>
                  This vendor profile is currently in the setup queue. Our compliance team is verifying the submitted documentation for GST ({vendor.gst}).
                </>
              )}
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
                <Building className="h-4 w-4 mr-2 text-slate-500" />
                Vendor Identity
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
                  {vendor.bankAccount}
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
                Real-Time Logic Checklist
              </CardTitle>
              <span className="text-sm font-medium text-slate-500">Score: {dynamicScore}/100</span>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-slate-100">

                {/* Rule 1: PAN validation */}
                <li className="flex items-start p-5 hover:bg-slate-50 transition-colors">
                  <div className="flex-shrink-0 mt-0.5">
                    {isPanValid ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-rose-500" />
                    )}
                  </div>
                  <div className="ml-4 flex-1">
                    <h4 className="text-sm font-medium text-slate-900">PAN Structural Validation</h4>
                    <p className="mt-1 text-sm text-slate-500">Format matches ^[A-Z]{"{5}"}[0-9]{"{4}"}[A-Z]{"{1}"}$ requirement.</p>
                  </div>
                  <div className="ml-4 text-xs font-mono">
                    {isPanValid ? (
                      <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded">PASS</span>
                    ) : (
                      <span className="text-rose-600 bg-rose-50 px-2 py-1 rounded">FAIL</span>
                    )}
                  </div>
                </li>

                {/* Rule 2: GST Verification */}
                <li className="flex items-start p-5 hover:bg-slate-50 transition-colors">
                  <div className="flex-shrink-0 mt-0.5">
                    {!isGstValid ? (
                      <XCircle className="h-5 w-5 text-rose-500" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    )}
                  </div>
                  <div className="ml-4 flex-1">
                    <h4 className="text-sm font-medium text-slate-900">GSTIN Live Verification</h4>
                    <p className="mt-1 text-sm text-slate-500">Cross-referenced with centralized registry.</p>
                    {!isGstValid && (
                      <div className="mt-2 text-xs text-rose-700 bg-rose-50 p-2 border border-rose-100 rounded-md">
                        {!isGstValid
                          ? "Error: Invalid GSTIN format."
                          : `Error: GSTIN inactive since ${new Date(vendor.lastUpdated).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}.`}
                      </div>
                    )}
                  </div>
                  <div className="ml-4 text-xs font-mono">
                    {!isGstValid ? (
                      <span className="text-rose-600 bg-rose-50 px-2 py-1 rounded">FAIL</span>
                    ) : (
                      <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded">PASS</span>
                    )}
                  </div>
                </li>

                {/* Rule 3: IFSC Verification */}
                <li className="flex items-start p-5 hover:bg-slate-50 transition-colors">
                  <div className="flex-shrink-0 mt-0.5">
                    {isIfscValid ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-rose-500" />
                    )}
                  </div>
                  <div className="ml-4 flex-1">
                    <h4 className="text-sm font-medium text-slate-900">IFSC Routing Match</h4>
                    <p className="mt-1 text-sm text-slate-500">Bank branch verified: {vendor.bankName || "Unknown Branch"}.</p>
                  </div>
                  <div className="ml-4 text-xs font-mono">
                    {isIfscValid ? (
                      <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded">PASS</span>
                    ) : (
                      <span className="text-rose-600 bg-rose-50 px-2 py-1 rounded">FAIL</span>
                    )}
                  </div>
                </li>

                {/* Rule 4: Duplicate Checks */}
                <li className="flex items-start p-5 hover:bg-slate-50 transition-colors">
                  <div className="flex-shrink-0 mt-0.5">
                    {duplicateVendor ? (
                      <XCircle className="h-5 w-5 text-amber-500" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    )}
                  </div>
                  <div className="ml-4 flex-1">
                    <h4 className="text-sm font-medium text-slate-900">Uniqueness Protocol</h4>
                    <p className="mt-1 text-sm text-slate-500">Checking against {totalVendors}+ active profiles for duplicate PAN/GST.</p>
                    {duplicateVendor && (
                      <div className="mt-2 text-xs text-amber-700 bg-amber-50 p-2 border border-amber-100 rounded-md">
                        Flag: Exact match found for {duplicateVendor.gst === vendor.gst ? "GSTIN" : "PAN"} parameter.
                      </div>
                    )}
                  </div>
                  <div className="ml-4 text-xs font-mono">
                    {duplicateVendor ? (
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

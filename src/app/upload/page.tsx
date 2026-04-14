"use client"

import { useState, useEffect } from "react"
import { CloudUpload, FileSpreadsheet, CheckCircle2, AlertCircle, Download, Loader2 } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import ExcelJS from "exceljs"
import { saveAs } from "file-saver"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ProgressBar } from "@/components/ui/progress-bar"

type PreflightRow = { id: number; name: string; info: string; status: "READY" | "ERROR"; error?: string }

export default function IngestionPortal() {
  const [uploadType, setUploadType] = useState<"VENDOR" | "PAYMENT">("VENDOR")
  const [approvedVendors, setApprovedVendors] = useState<{ id: string; vendorId: string }[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadState, setUploadState] = useState<"IDLE" | "UPLOADING" | "PREFLIGHT">("IDLE")
  const [progress, setProgress] = useState(0)
  const [parsedRows, setParsedRows] = useState<(PreflightRow & { rawData?: any })[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [dialog, setDialog] = useState<{ isOpen: boolean; message: string; type: "success" | "error" }>({ isOpen: false, message: "", type: "success" })

  const closeDialog = () => setDialog(prev => ({ ...prev, isOpen: false }))
  const showMessage = (message: string, type: "success" | "error" = "success") => setDialog({ isOpen: true, message, type })

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const res = await fetch("/api/vendors?status=APPROVED");
        const data = await res.json();
        if (Array.isArray(data)) {
          setApprovedVendors(data);
        }
      } catch (err) {
        console.error("Failed to fetch approved vendors:", err);
      }
    };
    fetchVendors();
  }, []);

  const handleDownloadSample = async () => {
    try {
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet("Sample Format")

      if (uploadType === "VENDOR") {
        worksheet.columns = [
          { header: "name", key: "name", width: 25 },
          { header: "pan", key: "pan", width: 20 },
          { header: "gst", key: "gst", width: 25 },
          { header: "ifsc", key: "ifsc", width: 20 },
          { header: "bank_account", key: "bank_account", width: 25 },
          { header: "bank_name", key: "bank_name", width: 25 },
        ]

        worksheet.addRow({
          name: "Reliance Industries",
          pan: "PLMKO0987U",
          gst: "24MNBVC5678R1Z1",
          ifsc: "ICIC0005678",
          bank_account: "556677889900",
          bank_name: "HDFC Bank",
        })
      } else {
        worksheet.columns = [
          { header: "vendor_id", key: "vendor_id", width: 20 },
          { header: "amount", key: "amount", width: 15 },
          { header: "invoice_no", key: "invoice_no", width: 20 },
          { header: "remarks", key: "remarks", width: 30 },
        ]

        worksheet.addRow({
          vendor_id: "VND-001",
          amount: 50000.00,
          invoice_no: "INV/24/001",
          remarks: "Monthly Service Fee",
        })
      }

      const headerRow = worksheet.getRow(1)
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF4F46E5" },
        }
        cell.font = {
          color: { argb: "FFFFFFFF" },
          bold: true,
        }
        cell.alignment = { vertical: "middle", horizontal: "center" }
      })

      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
      saveAs(blob, uploadType === "VENDOR" ? "Vendor_Sample_Format.xlsx" : "Payment_Sample_Format.xlsx")
    } catch (error) {
      console.error("Export error:", error)
      showMessage("Failed to download sample file.", "error")
    }
  }

  const handleFileDrop = async (e: React.DragEvent<HTMLDivElement> | React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    setIsDragOver(false)

    let file: File | null = null;
    if ('dataTransfer' in e) {
      file = e.dataTransfer.files[0];
    } else if ('target' in e) {
      const target = e.target as HTMLInputElement;
      file = target.files?.[0] || null;
    }

    if (!file) return;

    setUploadState("UPLOADING")
    setProgress(0)
    setParsedRows([])

    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 85) return 85;
        return p + 15;
      })
    }, 150)

    try {
      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();

      await workbook.xlsx.load(buffer);
      const worksheet = workbook.worksheets[0];

      const newRows: (PreflightRow & { rawData?: any })[] = [];
      let rowId = 1;

      const headerRow = worksheet.getRow(1);
      const headers: Record<string, number> = {};
      headerRow.eachCell((cell, colNumber) => {
        headers[cell.text.toLowerCase().trim()] = colNumber;
      });

      if (uploadType === "VENDOR") {
        const nIdx = headers["name"] || 1;
        const pIdx = headers["pan"] || 2;
        const gIdx = headers["gst"] || 3;
        const iIdx = headers["ifsc"] || 4;
        const baIdx = headers["bank_account"] || 5;
        const bnIdx = headers["bank_name"] || 6;

        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return;

          const name = row.getCell(nIdx).text?.trim();
          const pan = row.getCell(pIdx).text?.trim().toUpperCase();
          const gst = row.getCell(gIdx).text?.trim().toUpperCase();
          const ifsc = row.getCell(iIdx).text?.trim().toUpperCase();
          const bank_account = row.getCell(baIdx).text?.trim().replace(/\D/g, "");
          const bank_name = row.getCell(bnIdx).text?.trim();

          if (!name && !pan && !gst) return;

          const isPanValid = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan || "");
          const isGstValid = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gst || "");
          const isIfscValid = /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc || "");
          const isBankAccountValid = bank_account && bank_account.length >= 8;
          const isBankNameValid = bank_name && bank_name.length >= 3;

          let status: "READY" | "ERROR" = "READY";
          let errorMsg = "";

          if (!name || name.length < 3) { status = "ERROR"; errorMsg = "Invalid Name"; }
          else if (!isPanValid) { status = "ERROR"; errorMsg = "Invalid PAN structure"; }
          else if (!isGstValid) { status = "ERROR"; errorMsg = "Invalid GSTIN structure"; }
          else if (!isIfscValid) { status = "ERROR"; errorMsg = "Invalid IFSC pattern"; }
          else if (!isBankAccountValid) { status = "ERROR"; errorMsg = "Invalid Account No"; }
          else if (!isBankNameValid) { status = "ERROR"; errorMsg = "Invalid Bank Name"; }

          newRows.push({
            id: rowId++,
            name: name || "Unknown",
            info: `PAN: ${pan || "N/A"}`,
            status,
            error: errorMsg,
            rawData: { name, pan, gst, ifsc, bank_account, bank_name }
          });
        });
      } else {
        // PAYMENT Ingestion
        const vIdx = headers["vendor_id"] || 1;
        const aIdx = headers["amount"] || 2;
        const invIdx = headers["invoice_no"] || 3;
        const rIdx = headers["remarks"] || 4;

        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return;

          const vendor_id = row.getCell(vIdx).text?.trim().toUpperCase();
          const amountStr = row.getCell(aIdx).text?.trim();
          const invoice_no = row.getCell(invIdx).text?.trim();
          const remarks = row.getCell(rIdx).text?.trim();

          if (!vendor_id && !amountStr) return;

          const amount = parseFloat(amountStr || "0");
          const isVendorIdValidFormat = /^VND-\d{3}$/.test(vendor_id || "");
          const vendorExists = approvedVendors.some(v => v.vendorId === vendor_id);
          const isAmountValid = amount > 0;
          const isInvoiceValid = invoice_no && invoice_no.length >= 2;

          let status: "READY" | "ERROR" = "READY";
          let errorMsg = "";

          if (!isVendorIdValidFormat) { status = "ERROR"; errorMsg = "Invalid ID Format (VND-XXX)"; }
          else if (!vendorExists) { status = "ERROR"; errorMsg = "Vendor ID does not exist / Not Approved"; }
          else if (!isAmountValid) { status = "ERROR"; errorMsg = "Amount must be > 0"; }
          else if (!isInvoiceValid) { status = "ERROR"; errorMsg = "Invalid Invoice No"; }

          newRows.push({
            id: rowId++,
            name: vendor_id || "Unknown",
            info: `AMT: ₹${amount.toLocaleString()} | ${invoice_no || "N/A"}`,
            status,
            error: errorMsg,
            rawData: { vendor_id, amount, invoice_no, remarks }
          });
        });
      }

      setParsedRows(newRows);
      clearInterval(interval);
      setProgress(100);
      setTimeout(() => setUploadState("PREFLIGHT"), 400);

    } catch (err) {
      clearInterval(interval);
      console.error(err);
      showMessage("Failed to parse file. Please export the Sample Format and use that Excel file (.xlsx).", "error");
      setUploadState("IDLE");
    }
  }

  const importValidRows = async () => {
    const validRows = parsedRows.filter(r => r.status === "READY").map(r => r.rawData);
    if (validRows.length === 0) return;

    setIsImporting(true);
    try {
      const endpoint = uploadType === "VENDOR" ? "/api/vendors/upload" : "/api/payments/upload";
      const body = uploadType === "VENDOR" ? { vendors: validRows } : { payments: validRows };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      showMessage(`Imported ${data.count || data.success ? (data.count || validRows.length) : 0} items successfully!`, "success");
      setUploadState("IDLE");
      setParsedRows([]);
      setProgress(0);
    } catch (e: any) {
      showMessage(e.message || "Error importing the data", "error");
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Upload Portal</h2>
          <p className="text-slate-500 mt-1 cursor-default">Bulk import and pre-flight validation of {uploadType.toLowerCase()} records</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => { setUploadType("VENDOR"); if (uploadState !== "UPLOADING") setUploadState("IDLE"); }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${uploadType === "VENDOR" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Vendor
            </button>
            <button
              onClick={() => { setUploadType("PAYMENT"); if (uploadState !== "UPLOADING") setUploadState("IDLE"); }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${uploadType === "PAYMENT" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Payment
            </button>
          </div>
          <button
            onClick={handleDownloadSample}
            className="group flex items-center gap-2 bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 px-4 py-2 rounded-lg transition-all shadow-sm font-medium text-sm"
          >
            <span>Sample file</span>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
          </button>
        </div>
      </div>

      <div className="grid gap-6">

        {/* Upload Dropzone */}
        {uploadState === "IDLE" && (
          <div
            className={`mt-4 relative overflow-hidden rounded-xl border-2 border-dashed transition-all duration-200 p-16 flex flex-col items-center justify-center bg-white 
              ${isDragOver ? "border-indigo-500 bg-indigo-50/50" : "border-slate-300 hover:border-indigo-400 hover:bg-slate-50"}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleFileDrop}
          >
            <div className="h-16 w-16 mb-4 rounded-full bg-indigo-50 flex items-center justify-center pointer-events-none">
              <CloudUpload className={`h-8 w-8 transition-colors ${isDragOver ? "text-indigo-600" : "text-indigo-400"}`} />
            </div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2 pointer-events-none">Drag & drop your Excel file here</h3>
            <p className="text-sm text-slate-500 mb-6 max-w-sm text-center pointer-events-none">
              Only standard vendor format Excel files (.xlsx) are supported. Max file size: 50MB.
            </p>
            <div className="relative">
              <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".xlsx, .csv" onChange={handleFileDrop} />
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm cursor-pointer pointer-events-none">
                Browse Files
              </button>
            </div>
          </div>
        )}

        {/* Uploading State */}
        {uploadState === "UPLOADING" && (
          <Card className="mt-4 p-12 flex flex-col items-center justify-center text-center max-w-3xl mx-auto w-full">
            <FileSpreadsheet className="h-12 w-12 text-indigo-400 mb-4 animate-bounce" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Analyzing Data Integrity...</h3>
            <p className="text-sm text-slate-500 mb-6">Extracting rows and running heuristic checks...</p>
            <div className="w-full max-w-sm">
              <ProgressBar value={progress} className="h-3" />
            </div>
            <p className="text-xs font-mono text-slate-400 mt-3">{progress}% complete</p>
          </Card>
        )}

        {/* Pre-flight Data Table */}
        {uploadState === "PREFLIGHT" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 mr-2" />
                Pre-flight Inspection Results
              </h3>
              <div className="flex gap-3">
                <button onClick={() => setUploadState("IDLE")} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                  Cancel File
                </button>
                <button
                  onClick={importValidRows}
                  disabled={isImporting || parsedRows.filter(r => r.status === "READY").length === 0}
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  {isImporting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Import {parsedRows.filter(r => r.status === "READY").length} Valid Rows
                </button>
              </div>
            </div>

            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Row #</th>
                      <th className="px-6 py-4 font-semibold">{uploadType === "VENDOR" ? "Vendor Extracted Name" : "Vendor ID"}</th>
                      <th className="px-6 py-4 font-semibold">{uploadType === "VENDOR" ? "Key Identifier" : "Payment Reference"}</th>
                      <th className="px-6 py-4 font-semibold">Validation Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((row) => (
                      <tr key={row.id} className={row.status === "ERROR" ? "bg-rose-50/30" : "bg-white"}>
                        <td className="px-6 py-4 font-mono text-slate-500 text-xs">A{row.id + 1}</td>
                        <td className="px-6 py-4 font-medium text-slate-900">{row.name}</td>
                        <td className="px-6 py-4 text-slate-600 font-mono text-xs">{row.info}</td>
                        <td className="px-6 py-4">
                          {row.status === "READY" ? (
                            <span className="inline-flex items-center text-emerald-700 text-xs font-medium">
                              <CheckCircle2 className="h-4 w-4 mr-1.5" />
                              Ready to Import
                            </span>
                          ) : (
                            <div className="flex flex-col">
                              <span className="inline-flex items-center text-rose-700 text-xs font-medium">
                                <AlertCircle className="h-4 w-4 mr-1.5" />
                                Logic Error
                              </span>
                              <span className="text-xs text-rose-600 mt-1">{row.error}</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        )}

      </div>

      {/* Custom Global App Dialog Overlay */}
      <AnimatePresence>
        {dialog.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl max-w-sm w-full overflow-hidden"
            >
              <div className="p-6">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${dialog.type === 'success' ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                  {dialog.type === 'success' ? <CheckCircle2 className="w-6 h-6 text-emerald-600" /> : <AlertCircle className="w-6 h-6 text-rose-600" />}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {dialog.type === 'success' ? 'Success' : 'Error'}
                </h3>
                <p className="text-slate-600 text-sm">
                  {dialog.message}
                </p>
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  onClick={closeDialog}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                >
                  Okay
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

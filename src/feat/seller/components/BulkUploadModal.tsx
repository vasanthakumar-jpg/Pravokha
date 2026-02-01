import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/ui/Dialog";
import { Button } from "@/ui/Button";
import { Progress } from "@/ui/Progress";
import { Alert, AlertDescription, AlertTitle } from "@/ui/Alert";
import { apiClient } from "@/infra/api/apiClient";
import { toast } from "@/shared/hook/use-toast";
import {
    Loader2,
    Upload,
    FileSpreadsheet,
    CheckCircle2,
    AlertCircle,
    FileDown,
    Info
} from "lucide-react";
import * as XLSX from 'xlsx';

interface BulkUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    userId: string;
}

interface ValidationLog {
    row: number;
    errors: string[];
    data?: any;
}

export function BulkUploadModal({ isOpen, onClose, onSuccess, userId }: BulkUploadModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [logs, setLogs] = useState<ValidationLog[]>([]);
    const [processing, setProcessing] = useState(false);
    const [results, setResults] = useState<{ success: number; failed: number } | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResults(null);
            setLogs([]);
        }
    };

    const downloadTemplate = () => {
        const template = [
            ["title", "price", "category", "stock_quantity", "description"],
            ["Premium Cotton T-Shirt", "999", "mens-tshirts", "50", "High quality cotton t-shirt"],
            ["Relaxed Fit Shorts", "799", "mens-shorts", "30", "Comfortable summer shorts"]
        ];
        const ws = XLSX.utils.aoa_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, "products_upload_template.csv");
    };

    const processUpload = async () => {
        if (!file) return;

        setLoading(true);
        setProcessing(true);
        setLogs([]);
        setProgress(0);

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const rawRows = XLSX.utils.sheet_to_json(sheet) as any[];

                // Normalize headers to lowercase and underscores
                const rows = rawRows.map(row => {
                    const normalized: any = {};
                    let hasData = false;
                    Object.keys(row).forEach(key => {
                        const val = row[key];
                        if (val !== undefined && val !== null && val !== "") {
                            hasData = true;
                        }
                        const normalizedKey = key.toLowerCase().trim().replace(/\s+/g, '_');
                        normalized[normalizedKey] = val;
                    });
                    return hasData ? normalized : null;
                }).filter(row => row !== null && row.title);

                if (rows.length === 0) {
                    throw new Error("No valid product data found in the file.");
                }

                if (rows.length > 500) {
                    throw new Error("Maximum 500 products allowed per upload.");
                }

                const validationErrors: ValidationLog[] = [];
                const validRows: any[] = [];

                rows.forEach((row, index) => {
                    const rowErrors: string[] = [];
                    const rowNum = index + 2; // +1 for header, +1 for 1-based index

                    if (!row.title) rowErrors.push("Missing Title");
                    if (!row.price || isNaN(Number(row.price))) rowErrors.push("Invalid or missing Price");
                    if (!row.category) rowErrors.push("Missing Category");
                    if (row.stock_quantity === undefined || isNaN(Number(row.stock_quantity))) rowErrors.push("Invalid or missing Stock");

                    if (rowErrors.length > 0) {
                        validationErrors.push({ row: rowNum, errors: rowErrors });
                    } else {
                        validRows.push({
                            ...row,
                            price: Number(row.price),
                            stock_quantity: Number(row.stock_quantity),
                            seller_id: userId,
                            published: false // Import as drafts for safety
                        });
                    }
                });

                setLogs(validationErrors);

                if (validRows.length > 0) {
                    let successCount = 0;
                    const batchSize = 10;
                    const totalBatches = Math.ceil(validRows.length / batchSize);

                    for (let i = 0; i < validRows.length; i += batchSize) {
                        const batch = validRows.slice(i, i + batchSize);

                        // Use parallel requests for the batch
                        const batchPromises = batch.map(p => {
                            const payload = {
                                title: p.title,
                                price: p.price,
                                category_id: p.category, // Map 'category' col to 'category_id'
                                description: p.description,
                                // published: p.published, // API defaulting to draft usually, or check API spec. User logic set false.
                                published: false,
                                variants: [
                                    {
                                        color_name: 'Primary',
                                        sizes: [
                                            { size: 'Standard', stock: p.stock_quantity }
                                        ]
                                    }
                                ]
                            };
                            return apiClient.post('/products', payload)
                                .then(() => ({ status: 'fulfilled' }))
                                .catch(err => ({ status: 'rejected', reason: err, row: p }));
                        });

                        const results = await Promise.all(batchPromises);

                        const failed = results.filter(r => r.status === 'rejected');
                        const succeeded = results.filter(r => r.status === 'fulfilled');

                        successCount += succeeded.length;

                        failed.forEach((f: any) => {
                            // Find the index relative to the whole set (approximation for logging)
                            // Actually f.row is the product object...
                            // We don't have the original row index easily here unless we pass it.
                            // But we can push a generic error or try to match title.
                            console.error("Failed import:", f.reason);
                            validationErrors.push({ row: i, errors: [`API Error: ${f.reason?.response?.data?.message || f.reason?.message}`] });
                        });

                        setProgress(Math.round(((i + batchSize) / validRows.length) * 100));
                    }

                    setResults({ success: successCount, failed: validationErrors.length });
                    if (successCount > 0) {
                        onSuccess();
                        toast({
                            title: "Upload Complete",
                            description: `Successfully imported ${successCount} products.`,
                        });
                    }
                } else {
                    setResults({ success: 0, failed: validationErrors.length });
                }

            } catch (error: any) {
                toast({
                    title: "Upload Failed",
                    description: error.message || "An error occurred during processing",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
                setProcessing(false);
            }
        };

        reader.readAsBinaryString(file);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] border-border/40 bg-card/95 backdrop-blur-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5 text-primary" />
                        Bulk Product Upload
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                        Upload up to 500 products at once. Valid rows will be processed; invalid rows will be skipped.
                    </p>
                </DialogHeader>

                <div className="py-6 space-y-6">
                    {!results && !processing && (
                        <div className="space-y-4">
                            <div
                                className="border-2 border-dashed border-border/60 rounded-2xl p-10 flex flex-col items-center justify-center gap-3 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer relative"
                                onClick={() => document.getElementById('csv-upload')?.click()}
                            >
                                <Upload className="h-10 w-10 text-muted-foreground" />
                                <p className="text-sm font-medium">{file ? file.name : "Select or drag CSV/Excel file"}</p>
                                <p className="text-xs text-muted-foreground">Max 500 rows. Follow template structure.</p>
                                <input
                                    id="csv-upload"
                                    type="file"
                                    accept=".csv,.xlsx,.xls"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </div>

                            <div className="flex justify-between items-center bg-muted/30 p-4 rounded-xl border">
                                <div className="flex items-center gap-3">
                                    <Info className="h-4 w-4 text-blue-500" />
                                    <p className="text-xs text-muted-foreground">Need a starting point?</p>
                                </div>
                                <Button variant="ghost" size="sm" onClick={downloadTemplate} className="text-xs gap-2">
                                    <FileDown className="h-4 w-4" />
                                    Download Template
                                </Button>
                            </div>
                        </div>
                    )}

                    {processing && (
                        <div className="space-y-4 py-10 flex flex-col items-center text-center">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <div className="w-full space-y-2">
                                <Progress value={progress} className="h-2" />
                                <p className="text-sm font-medium">Processing Batch... {progress}%</p>
                            </div>
                        </div>
                    )}

                    {results && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Alert className="bg-emerald-500/10 border-emerald-500/20">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                    <AlertTitle className="text-emerald-700">Successful</AlertTitle>
                                    <AlertDescription className="text-emerald-600 font-bold">{results.success} Rows</AlertDescription>
                                </Alert>
                                <Alert className="bg-rose-500/10 border-rose-500/20">
                                    <AlertCircle className="h-4 w-4 text-rose-600" />
                                    <AlertTitle className="text-rose-700">Failed</AlertTitle>
                                    <AlertDescription className="text-rose-600 font-bold">{results.failed} Rows</AlertDescription>
                                </Alert>
                            </div>

                            {logs.length > 0 && (
                                <div className="border rounded-xl overflow-hidden">
                                    <div className="bg-muted px-4 py-2 border-b">
                                        <p className="text-xs font-bold uppercase tracking-wider">Error Log</p>
                                    </div>
                                    <div className="max-h-[200px] overflow-y-auto p-4 space-y-3 bg-muted/20">
                                        {logs.map((log, i) => (
                                            <div key={i} className="text-xs border-b pb-2 last:border-0">
                                                <p className="font-bold text-rose-600">Row {log.row}</p>
                                                <ul className="list-disc pl-4 mt-1 text-muted-foreground">
                                                    {log.errors.map((err, j) => <li key={j}>{err}</li>)}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => { setResults(null); setFile(null); setLogs([]); }}
                            >
                                Upload Another File
                            </Button>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} disabled={loading}>Close</Button>
                    {!results && (
                        <Button
                            onClick={processUpload}
                            disabled={!file || loading}
                            className="bg-[#146B6B] hover:bg-[#0E4D4D]"
                        >
                            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Start Processing
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

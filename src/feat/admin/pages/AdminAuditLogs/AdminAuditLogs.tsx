import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Activity,
    Search,
    Filter,
    ArrowLeft,
    Download,
    RefreshCw,
    Calendar as CalendarIcon,
    Shield,
    Database,
    Lock,
    Eye,
    FilterX,
    FileText,
    User,
    Clock,
    Tag,
    ChevronRight,
} from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { getMediaUrl } from "@/lib/utils";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter,
} from "@/ui/Card";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { Badge } from "@/ui/Badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/ui/Table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/ui/Select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/ui/Popover";
import { Calendar } from "@/ui/Calendar";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/ui/Sheet";
import { apiClient } from "@/infra/api/apiClient";
import { useToast } from "@/shared/hook/use-toast";
import { AdminSkeleton } from "@/feat/admin/components/AdminSkeleton";
import { useAuth } from "@/core/context/AuthContext";
import { useAdmin } from "@/core/context/AdminContext";
import { cn } from "@/lib/utils";
import { NoResultsFound } from "@/feat/admin/components/NoResultsFound";

interface AuditLog {
    id: string;
    createdAt: string;
    actionType: string;
    targetType: string;
    targetId: string;
    actorId: string;
    description: string;
    metadata: any;
    severity: 'info' | 'warning' | 'critical';
    actor?: {
        name: string;
        email: string;
        avatarUrl?: string;
    };
}

const MetadataRenderer = ({ data }: { data: any }) => {
    if (!data) return <span className="text-muted-foreground italic">None</span>;

    return (
        <div className="space-y-3 font-mono text-[10px]">
            {Object.entries(data).map(([key, value]) => (
                <div key={key} className="flex flex-col gap-1.5 p-3 rounded-xl bg-muted/30 border border-border/40 group hover:bg-muted/50 transition-colors">
                    <span className="text-primary font-black uppercase tracking-widest opacity-60 flex items-center gap-1.5">
                        <Tag className="h-3 w-3" /> {key}
                    </span>
                    <pre className="text-xs font-bold text-foreground break-all whitespace-pre-wrap">
                        {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                    </pre>
                </div>
            ))}
        </div>
    );
};

export default function AdminAuditLogs() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user: currentUser } = useAuth();
    const { isAdmin, loading: adminLoading } = useAdmin();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [actionFilter, setActionFilter] = useState("all");
    const [severityFilter, setSeverityFilter] = useState("all");
    const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
        from: undefined,
        to: undefined
    });
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const pageSize = 10;

    // CRITICAL: Authentication check to prevent unauthorized access
    useEffect(() => {
        if (!adminLoading && !isAdmin) {
            navigate("/auth");
        }
    }, [isAdmin, adminLoading, navigate]);

    useEffect(() => {
        if (!adminLoading && isAdmin) {
            fetchLogs();
        }
    }, [adminLoading, isAdmin, currentPage, actionFilter, severityFilter, searchQuery, dateRange]);

    const fetchLogs = async () => {
        try {
            setLoading(true);

            const params = {
                limit: pageSize,
                skip: (currentPage - 1) * pageSize,
                actionType: actionFilter === 'all' ? undefined : actionFilter,
                severity: severityFilter === 'all' ? undefined : severityFilter,
                searchQuery: searchQuery || undefined,
                fromDate: dateRange.from ? dateRange.from.toISOString() : undefined,
                toDate: dateRange.to ? dateRange.to.toISOString() : undefined
            };

            const response = await apiClient.get('/audit', { params });
            setTotalCount(response.data.total || 0);
            setLogs(response.data.logs || []);
        } catch (error: any) {
            toast({
                title: "Fetch failed",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const getSeverityBadge = (severity: string) => {
        switch (severity) {
            case 'critical':
                return <Badge variant="destructive" className="bg-rose-500/10 text-rose-500 border-rose-500/20 font-bold px-3 py-0.5 rounded-full">Critical</Badge>;
            case 'warning':
                return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 font-bold px-3 py-0.5 rounded-full">Warning</Badge>;
            default:
                return <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/20 font-bold px-3 py-0.5 rounded-full">Info</Badge>;
        }
    };

    const filteredLogs = logs;

    const resetFilters = () => {
        setSearchQuery("");
        setActionFilter("all");
        setSeverityFilter("all");
        setDateRange({ from: undefined, to: undefined });
    };

    const exportToCSV = () => {
        const headers = ["Timestamp", "Description", "Action", "Principal", "Email", "Severity"];
        const rows = filteredLogs.map(log => [
            log.createdAt,
            log.description,
            log.actionType,
            log.actor?.name || 'System',
            log.actor?.email || 'N/A',
            log.severity
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(r => r.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `audit_trail_${format(new Date(), "yyyy-MM-dd")}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading && logs.length === 0) {
        return <AdminSkeleton variant="table" />;
    }

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 flex flex-col gap-8 pb-10 min-h-screen animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 rounded-xl border-border/60 bg-card gap-2 font-medium text-xs w-fit justify-start shadow-sm"
                            onClick={() => navigate("/admin")}
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
                        <div className="min-w-0">
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center flex-wrap gap-3">
                                System Audit Registry
                                <Badge variant="outline" className="text-xs font-medium bg-primary/5 rounded-lg border-primary/20 shrink-0">
                                    {logs.length} Total
                                </Badge>
                            </h1>
                            <p className="text-xs sm:text-base text-muted-foreground mt-1">
                                Real-time governance telemetry and operational traceability
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button
                            variant="outline"
                            disabled={loading}
                            onClick={() => {
                                fetchLogs();
                                toast({
                                    title: "Registry Synchronized",
                                    description: "The audit trail has been updated with the latest telemetry data.",
                                    className: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                                });
                            }}
                            className="h-8 gap-2"
                        >
                            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                            Refresh
                        </Button>
                        <Button
                            className="flex-1 sm:flex-none h-10 rounded-xl font-bold text-xs bg-primary hover:bg-primary/90 shadow-md shadow-primary/20"
                            onClick={exportToCSV}
                        >
                            <Download className="mr-2 h-4 w-4" /> Export analytics
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">

                {/* Left Column: Filters & Summaries */}
                <div className="xl:col-span-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-6 h-fit">
                    <Card className="border-border/60 bg-card rounded-2xl overflow-hidden shadow-sm">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-muted-foreground/80">
                                <FilterX className="h-4 w-4 text-primary opacity-70" /> Filter matrix
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-2">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground flex items-center gap-2 ml-1">
                                    <Search className="h-3 w-3" /> Search logs
                                </label>
                                <Input
                                    placeholder="Actor, ID, Action..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-background border-border/60 rounded-xl h-11 text-xs focus:ring-primary/20"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground ml-1">Action type</label>
                                <Select value={actionFilter} onValueChange={setActionFilter}>
                                    <SelectTrigger className="bg-background border-border/60 rounded-xl h-11 text-xs px-4">
                                        <SelectValue placeholder="All actions" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-border/40">
                                        <SelectItem value="all">All actions</SelectItem>
                                        <SelectItem value="payout_request">Financial governance</SelectItem>
                                        <SelectItem value="verification_approved">Identity verification</SelectItem>
                                        <SelectItem value="order_status_update">Marketplace logic</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground ml-1">Severity</label>
                                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                                    <SelectTrigger className="bg-background border-border/60 rounded-xl h-11 text-xs px-4">
                                        <SelectValue placeholder="All severities" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-border/40">
                                        <SelectItem value="all">All severities</SelectItem>
                                        <SelectItem value="info" className="text-blue-500 font-bold">Informational</SelectItem>
                                        <SelectItem value="warning" className="text-amber-500 font-bold">Warning</SelectItem>
                                        <SelectItem value="critical" className="text-red-500 font-bold">Critical</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground ml-1">Date range</label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-start text-left font-medium bg-background border-border/60 rounded-xl h-11 text-xs",
                                                !dateRange && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4 text-primary/60" />
                                            {dateRange?.from ? (
                                                dateRange.to ? (
                                                    <>{format(dateRange.from, "MMM dd")} — {format(dateRange.to, "MMM dd")}</>
                                                ) : (
                                                    format(dateRange.from, "MMM dd")
                                                )
                                            ) : (
                                                <span>Select range</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 rounded-2xl border-border/40" align="start">
                                        <Calendar
                                            initialFocus
                                            mode="range"
                                            defaultMonth={dateRange?.from}
                                            selected={dateRange as any}
                                            onSelect={setDateRange as any}
                                            numberOfMonths={1}
                                            className="bg-background"
                                        />
                                        <div className="p-3 bg-muted/30 border-t border-border/40 grid grid-cols-2 gap-2">
                                            <Button variant="ghost" className="text-[10px] font-bold h-8 hover:bg-muted" onClick={() => setDateRange({ from: startOfDay(new Date()), to: endOfDay(new Date()) })}>Today</Button>
                                            <Button variant="ghost" className="text-[10px] font-bold h-8 hover:bg-muted" onClick={() => setDateRange({ from: subDays(new Date(), 7), to: new Date() })}>7 Days</Button>
                                            <Button variant="ghost" className="text-[10px] font-bold h-8 hover:bg-muted" onClick={() => setDateRange({ from: subDays(new Date(), 30), to: new Date() })}>30 Days</Button>
                                            <Button variant="ghost" className="text-[10px] font-bold h-8 hover:bg-muted text-red-500" onClick={() => setDateRange({ from: undefined, to: undefined })}>Reset</Button>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="pt-4 border-t border-border/40">
                                <Button
                                    variant="ghost"
                                    className="w-full text-xs h-10 font-bold hover:bg-red-500/5 hover:text-red-500 rounded-xl transition-colors"
                                    onClick={resetFilters}
                                >
                                    Reset all filters
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/60 bg-card rounded-2xl overflow-hidden shadow-sm">
                        <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Shield className="h-4 w-4 text-primary opacity-70" /> Integrity
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border/60">
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-bold text-muted-foreground">Events</p>
                                    <p className="text-xl font-black tabular-nums">{logs.length}</p>
                                </div>
                                <Activity className="h-6 w-6 text-primary opacity-50" />
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border/60">
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-bold text-rose-500">Critical</p>
                                    <p className="text-xl font-black text-rose-600 tabular-nums">{logs.filter(l => l.severity === 'critical').length}</p>
                                </div>
                                <Lock className="h-6 w-6 text-rose-500 opacity-50" />
                            </div>
                            <p className="text-[10px] leading-relaxed text-muted-foreground font-medium italic opacity-70 px-1 pt-2">
                                All records are cryptographically sealed.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Dynamic Feed */}
                <div className="xl:col-span-3">
                    <Card className="border-border/60 bg-card rounded-2xl h-full overflow-hidden shadow-sm">
                        <CardHeader className="p-6 border-b border-border/40 bg-muted/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-xl font-heading font-semibold">Audit trail</CardTitle>
                                    <CardDescription className="text-xs">
                                        Live platform telemetry log
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-xs font-medium text-emerald-600">Live pulse</span>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">
                            {/* Mobile Card View */}
                            <div className="sm:hidden px-4 pb-4 space-y-4">
                                {loading ? (
                                    <AdminSkeleton variant="list" skeletonProps={{ count: 3 }} />
                                ) : filteredLogs.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <p>No activity found</p>
                                    </div>
                                ) : (
                                    filteredLogs.map((log) => (
                                        <Card key={log.id} className="border-border/40 bg-card overflow-hidden shadow-sm" onClick={() => setSelectedLog(log)}>
                                            <CardHeader className="p-4 bg-muted/20 border-b border-border/10 flex flex-row items-center justify-between space-y-0">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                        {log.actor?.name?.charAt(0) || <Activity className="h-4 w-4" />}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold truncate max-w-[120px]">{log.actor?.name || 'System'}</span>
                                                        <span className="text-[10px] text-muted-foreground">{log.createdAt ? format(new Date(log.createdAt), "MMM d, HH:mm") : "N/A"}</span>
                                                    </div>
                                                </div>
                                                {getSeverityBadge(log.severity)}
                                            </CardHeader>
                                            <CardContent className="p-4 pt-3 flex flex-col gap-3">
                                                <p className="text-xs font-medium leading-relaxed line-clamp-2">{log.description.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '...')}</p>
                                                <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-border/40">
                                                    <Button variant="ghost" size="sm" className="h-6 text-[10px] font-bold text-muted-foreground hover:text-primary px-0 rounded-md">
                                                        View <ChevronRight className="ml-0.5 h-3 w-3" />
                                                    </Button>
                                                    <Badge variant="outline" className="px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider bg-primary/10 border-primary/20 text-primary whitespace-nowrap">
                                                        {log.actionType.replace(/_/g, ' ')}
                                                    </Badge>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </div>

                            {/* Desktop Table View */}
                            <div className="overflow-x-auto hidden sm:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/30 border-b border-border/40 hover:bg-transparent">
                                            <TableHead className="text-xs font-medium text-muted-foreground/70 pl-6">Timestamp</TableHead>
                                            <TableHead className="text-xs font-medium text-muted-foreground/70">Description</TableHead>
                                            <TableHead className="text-xs font-medium text-muted-foreground/70">Principal</TableHead>

                                            <TableHead className="text-right text-xs font-medium text-muted-foreground/70 pr-6">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <AnimatePresence mode="popLayout">
                                            {filteredLogs.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="p-0">
                                                        <NoResultsFound
                                                            searchTerm={searchQuery}
                                                            onReset={resetFilters}
                                                            className="border-none bg-transparent"
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                filteredLogs.map((log) => (
                                                    <motion.tr
                                                        key={log.id}
                                                        layout
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        className="group hover:bg-muted/20 transition-colors border-b border-border/20 last:border-0"
                                                    >
                                                        <TableCell className="pl-6 py-4">
                                                            <div className="flex flex-col min-w-[100px]">
                                                                <span className="text-sm font-medium">{format(new Date(log.createdAt), "MMM d, yyyy")}</span>
                                                                <span className="text-[10px] text-muted-foreground font-mono transition-opacity opacity-0 group-hover:opacity-100">{format(new Date(log.createdAt), "HH:mm:ss")}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="text-sm font-semibold leading-tight group-hover:text-primary transition-colors">{log.description.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '...')}</span>
                                                                <div className="flex items-center gap-2">
                                                                    <Badge variant="outline" className="px-1.5 py-0 rounded text-[9px] font-bold bg-muted/50 border-border/40 text-muted-foreground">
                                                                        {log.actionType.replace(/_/g, ' ')}
                                                                    </Badge>
                                                                    <span className="text-[9px] font-medium text-primary/60">{log.targetType}</span>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-3">
                                                                {log.actor?.avatarUrl ? (
                                                                    <img
                                                                        src={getMediaUrl(log.actor.avatarUrl)}
                                                                        alt={log.actor.name || 'User'}
                                                                        className="h-8 w-8 rounded-lg object-cover border border-primary/10 shadow-inner"
                                                                    />
                                                                ) : (
                                                                    <div className="h-8 w-8 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center text-primary text-[10px] font-bold shadow-inner">
                                                                        {log.actor?.name?.charAt(0) || <Activity className="h-3 w-3" />}
                                                                    </div>
                                                                )}
                                                                <div className="flex flex-col min-w-0">
                                                                    <span className="text-sm font-medium truncate max-w-[120px]">{log.actor?.name || 'System'}</span>
                                                                    <span className="text-[11px] text-muted-foreground/70 truncate max-w-[120px] opacity-60">{log.actor?.email || 'automated'}</span>
                                                                </div>
                                                            </div>
                                                        </TableCell>

                                                        <TableCell className="text-right pr-6">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-all"
                                                                onClick={() => setSelectedLog(log)}
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </motion.tr>
                                                ))
                                            )}
                                        </AnimatePresence>
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>

                        <CardFooter className="p-6 bg-muted/30 border-t border-border/40 justify-between items-center">
                            <p className="text-xs font-medium text-muted-foreground">
                                {filteredLogs.length} activity records visualized
                            </p>
                            <div className="flex items-center gap-1 opacity-50">
                                {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-1 w-1 rounded-full bg-primary" />)}
                            </div>
                        </CardFooter>
                    </Card>
                </div>
            </div>

            {/* Event Detail Sheet */}
            <Sheet open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
                <SheetContent className="w-full sm:max-w-2xl p-0 flex flex-col border-l border-border/60 bg-background shadow-2xl">
                    {selectedLog && (
                        <div className="flex flex-col h-full relative overflow-hidden">
                            {/* Accent blur for high priority */}
                            {selectedLog.severity === 'critical' && (
                                <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-[100px] -mr-32 -mt-32" />
                            )}

                            <SheetHeader className="p-8 border-b border-border/40 relative z-10 bg-muted/20">
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "h-10 w-10 rounded-2xl flex items-center justify-center border-2",
                                                selectedLog.severity === 'critical' ? "bg-rose-500/10 border-rose-500/20 text-rose-500" :
                                                    selectedLog.severity === 'warning' ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                                                        "bg-blue-500/10 border-blue-500/20 text-blue-500"
                                            )}>
                                                <Shield className="h-5 w-5" />
                                            </div>
                                            <div className="flex flex-col">
                                                <SheetTitle className="text-2xl font-black tracking-tighter">Event intelligence</SheetTitle>
                                                <SheetDescription className="font-bold text-muted-foreground">Record UID: {selectedLog.id.slice(0, 18)}</SheetDescription>
                                            </div>
                                        </div>
                                        {getSeverityBadge(selectedLog.severity)}
                                    </div>
                                </div>
                            </SheetHeader>

                            <div className="flex-1 overflow-y-auto p-8 space-y-8 relative z-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                                                <Activity className="h-3 w-3 text-primary" /> Action context
                                            </label>
                                            <p className="text-lg font-black leading-tight text-foreground">{selectedLog.description}</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1 p-3 rounded-2xl bg-muted/30 border border-border/40">
                                                <span className="text-xs font-medium text-muted-foreground">Category</span>
                                                <p className="text-xs font-bold text-primary truncate">{selectedLog.actionType.replace(/_/g, ' ')}</p>
                                            </div>
                                            <div className="space-y-1 p-3 rounded-2xl bg-muted/30 border border-border/40">
                                                <span className="text-xs font-medium text-muted-foreground">Target</span>
                                                <p className="text-xs font-bold text-emerald-600 truncate">{selectedLog.targetType}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <Card className="rounded-[2rem] border-border/40 bg-card overflow-hidden shadow-sm">
                                        <div className="p-6 bg-muted/30 border-b border-border/40">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 overflow-hidden">
                                                    {selectedLog.actor?.avatarUrl ? (
                                                        <img
                                                            src={getMediaUrl(selectedLog.actor.avatarUrl)}
                                                            className="h-full w-full object-cover"
                                                            alt={selectedLog.actor.name}
                                                        />
                                                    ) : (
                                                        <User className="h-5 w-5 text-primary" />
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-medium text-muted-foreground">Principal actor</span>
                                                    <span className="text-sm font-black truncate">{selectedLog.actor?.name || 'System Principal'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-6 space-y-4">
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                <span className="text-[10px] font-bold text-muted-foreground truncate">{selectedLog.actor?.email || 'Automated Daemon'}</span>
                                            </div>
                                            <div className="pt-4 border-t border-border/20">
                                                <span className="text-xs font-medium text-muted-foreground block mb-2">Actor ID hash</span>
                                                <code className="text-[10px] font-bold bg-muted p-2 rounded-lg block truncate">{selectedLog.actorId}</code>
                                            </div>
                                        </div>
                                    </Card>
                                </div>

                                <div className="space-y-4 pt-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Database className="h-4 w-4 text-primary" />
                                        <h4 className="text-sm font-semibold">Metadata telemetry</h4>
                                    </div>
                                    <MetadataRenderer data={selectedLog.metadata} />
                                </div>

                                <div className="pt-8 mt-8 border-t border-border/40">
                                    <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/5 border border-primary/10">
                                        <div className="flex items-center gap-3">
                                            <Clock className="h-5 w-5 text-primary" />
                                            <div className="flex flex-col">
                                                <span className="text-xs font-medium text-primary/60">Registry timestamp</span>
                                                <span className="text-sm font-black italic">{format(new Date(selectedLog.createdAt), "MMMM dd, yyyy • HH:mm:ss.SSS")}</span>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-primary opacity-20" />
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 bg-muted/30 border-t border-border/40 relative z-10">
                                <Button
                                    variant="outline"
                                    className="w-full rounded-2xl h-14 font-medium text-xs hover:bg-primary hover:text-white transition-all shadow-sm"
                                    onClick={() => setSelectedLog(null)}
                                >
                                    Dismiss record
                                </Button>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            {/* Pagination Controls */}
            {!loading && totalCount > pageSize && (
                <Card className="border-border/60 bg-card rounded-2xl">
                    <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6">
                        <div className="text-sm text-muted-foreground">
                            Showing <span className="font-bold text-foreground">{((currentPage - 1) * pageSize) + 1}</span> to{' '}
                            <span className="font-bold text-foreground">{Math.min(currentPage * pageSize, totalCount)}</span> of{' '}
                            <span className="font-bold text-foreground">{totalCount}</span> logs
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9 rounded-xl"
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </Button>
                            <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-muted">
                                <span className="text-sm font-bold">Page {currentPage}</span>
                                <span className="text-sm text-muted-foreground">of {Math.ceil(totalCount / pageSize)}</span>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9 rounded-xl"
                                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalCount / pageSize), prev + 1))}
                                disabled={currentPage >= Math.ceil(totalCount / pageSize)}
                            >
                                Next
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            )}
        </div>
    );
}


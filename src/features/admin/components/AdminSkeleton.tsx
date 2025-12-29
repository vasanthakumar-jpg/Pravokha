import { Skeleton } from "@/components/ui/Skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
};

export function AdminHeaderSkeleton({ showBack = true, showTitle = true, showDescription = true, showActions = false }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
                {showBack && <Skeleton className="h-9 w-20 rounded-xl shrink-0" />}
                <div className="space-y-2 flex-1">
                    {showTitle && <Skeleton className="h-8 w-64 rounded-lg" />}
                    {showDescription && <Skeleton className="h-4 w-full max-w-[400px] rounded-md opacity-60" />}
                </div>
            </div>
            {showActions && (
                <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-32 rounded-xl" />
                    <Skeleton className="h-10 w-24 rounded-xl" />
                </div>
            )}
        </div>
    );
}

export function AdminKpiSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="border-border/50 bg-card/60 backdrop-blur-xl">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <Skeleton className="h-3 w-24 rounded" />
                        <Skeleton className="h-10 w-10 rounded-xl" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-20 rounded-lg mb-2" />
                        <Skeleton className="h-4 w-28 rounded opacity-60" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

export function AdminTableSkeleton({ columns = 5, rows = 5 }) {
    return (
        <Card className="border-border/50 bg-card/60 backdrop-blur-xl overflow-hidden">
            <CardContent className="p-0">
                <div className="h-12 bg-muted/30 flex items-center px-4 border-b border-border/50">
                    {[...Array(columns)].map((_, i) => (
                        <Skeleton key={i} className={`h-4 ${i === 0 ? 'w-32' : 'w-24'} mr-4`} />
                    ))}
                </div>
                <div className="p-0">
                    {[...Array(rows)].map((_, i) => (
                        <div key={i} className="h-16 flex items-center px-4 border-b border-border/40">
                            {[...Array(columns)].map((_, j) => (
                                <Skeleton key={j} className={`h-4 ${j === 0 ? 'w-48' : 'w-32'} mr-4`} />
                            ))}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

export function AdminFilterSkeleton() {
    return (
        <Card className="border-border/50 bg-card/60 backdrop-blur-xl mb-6">
            <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <Skeleton className="h-11 flex-1 rounded-xl" />
                    <div className="flex gap-2">
                        <Skeleton className="h-11 w-32 rounded-xl" />
                        <Skeleton className="h-11 w-32 rounded-xl" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function AdminChartSkeleton() {
    return (
        <Card className="border-border/50 bg-card/60 backdrop-blur-xl h-80">
            <CardHeader>
                <Skeleton className="h-6 w-32 rounded-lg mb-2" />
                <Skeleton className="h-4 w-48 rounded opacity-60" />
            </CardHeader>
            <CardContent className="flex items-end gap-2 px-6 pb-6 h-[180px]">
                {[...Array(12)].map((_, i) => (
                    <Skeleton
                        key={i}
                        className="flex-1 rounded-t-sm"
                        style={{ height: `${Math.random() * 100 + 20}%` }}
                    />
                ))}
            </CardContent>
        </Card>
    );
}

export function AdminFeedSkeleton() {
    return (
        <Card className="border-border/50 bg-card/60 backdrop-blur-xl flex-1 flex flex-col">
            <CardHeader>
                <Skeleton className="h-6 w-40 rounded-lg mb-2" />
                <Skeleton className="h-4 w-60 rounded opacity-60" />
            </CardHeader>
            <CardContent className="flex-1 p-6 pt-0 space-y-6">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex gap-4">
                        <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-full rounded" />
                            <Skeleton className="h-3 w-24 rounded opacity-60" />
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

export function AdminFormSkeleton() {
    return (
        <Card className="border-border/50 bg-card/60 backdrop-blur-xl p-6 space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-11 w-full rounded-xl opacity-60" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-11 w-full rounded-xl opacity-60" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-28 rounded" />
                    <Skeleton className="h-11 w-full rounded-xl opacity-60" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-28 rounded" />
                    <Skeleton className="h-11 w-full rounded-xl opacity-60" />
                </div>
            </div>
            <div className="space-y-2">
                <Skeleton className="h-4 w-40 rounded" />
                <Skeleton className="h-32 w-full rounded-xl opacity-60" />
            </div>
            <div className="flex gap-3 pt-4">
                <Skeleton className="h-11 w-36 rounded-xl" />
                <Skeleton className="h-11 w-32 rounded-xl opacity-40" />
            </div>
        </Card>
    );
}

export function AdminCardGridSkeleton({ count = 8, noImage = false }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(count)].map((_, i) => (
                <Card key={i} className="overflow-hidden border-border/50 bg-card/60 backdrop-blur-xl rounded-3xl">
                    {!noImage && <Skeleton className="aspect-square w-full" />}
                    <CardContent className={cn("p-4 space-y-3", noImage && "pt-6")}>
                        <Skeleton className="h-5 w-2/3 rounded" />
                        <div className="space-y-2">
                            <Skeleton className="h-3 w-full rounded opacity-60" />
                            <Skeleton className="h-3 w-3/4 rounded opacity-40" />
                        </div>
                        <div className="flex gap-2 pt-2">
                            <Skeleton className="h-8 flex-1 rounded-lg" />
                            <Skeleton className="h-8 w-8 rounded-lg" />
                            <Skeleton className="h-8 flex-1 rounded-lg" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

export function AdminListSkeleton({ count = 3 }) {
    return (
        <div className="space-y-4">
            {[...Array(count)].map((_, i) => (
                <Card key={i} className="border-border/50 bg-card/60 backdrop-blur-xl overflow-hidden rounded-2xl">
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 p-6">
                        <div className="space-y-3 flex-1">
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-6 w-48 rounded" />
                                <Skeleton className="h-5 w-16 rounded-full" />
                            </div>
                            <Skeleton className="h-4 w-3/4 rounded opacity-60" />
                            <div className="flex gap-8 pt-2">
                                <Skeleton className="h-4 w-24 rounded" />
                                <Skeleton className="h-4 w-24 rounded" />
                                <Skeleton className="h-4 w-24 rounded" />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Skeleton className="h-9 w-9 rounded-lg" />
                            <Skeleton className="h-9 w-9 rounded-lg" />
                            <Skeleton className="h-9 w-9 rounded-lg" />
                        </div>
                    </CardHeader>
                </Card>
            ))}
        </div>
    );
}

export function AdminRegistrySkeleton({ columns = 4, rows = 5 }) {
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="bg-card/40 border-border/60">
                        <CardHeader className="p-4 flex flex-row items-center justify-between pb-1">
                            <Skeleton className="h-3 w-16" />
                            <Skeleton className="h-4 w-4 rounded" />
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <Skeleton className="h-8 w-12" />
                        </CardContent>
                    </Card>
                ))}
            </div>
            <Card className="border-border/50 bg-card/60 backdrop-blur-xl overflow-hidden rounded-2xl">
                <CardHeader className="p-6 border-b border-border/50 bg-muted/20">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between">
                        <Skeleton className="h-11 w-full max-w-md rounded-xl" />
                        <Skeleton className="h-11 w-44 rounded-xl" />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="h-14 flex items-center px-6 border-b border-border/40">
                        {[...Array(columns)].map((_, i) => (
                            <Skeleton key={i} className={`h-4 ${i === 0 ? 'w-48' : 'w-32'} mr-4 opacity-50`} />
                        ))}
                    </div>
                    <div className="p-0">
                        {[...Array(rows)].map((_, i) => (
                            <div key={i} className="h-20 flex items-center px-6 border-b border-border/40">
                                <div className="flex items-center gap-3 w-48 mr-4">
                                    <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-4 w-full rounded" />
                                        <Skeleton className="h-3 w-2/3 rounded opacity-60" />
                                    </div>
                                </div>
                                {[...Array(columns - 1)].map((_, j) => (
                                    <Skeleton key={j} className="h-4 w-32 mr-4 opacity-40 ml-auto first:ml-0" />
                                ))}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export function AdminSupportSkeleton() {
    return (
        <div className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 border-border/50 bg-card/60 backdrop-blur-xl">
                <CardHeader>
                    <Skeleton className="h-6 w-32 rounded" />
                </CardHeader>
                <CardContent className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="p-4 border rounded-xl space-y-3">
                            <div className="flex justify-between">
                                <Skeleton className="h-4 w-24 rounded" />
                                <Skeleton className="h-5 w-12 rounded-full" />
                            </div>
                            <Skeleton className="h-3 w-16 rounded opacity-60" />
                            <Skeleton className="h-9 w-full rounded-xl opacity-40" />
                        </div>
                    ))}
                </CardContent>
            </Card>
            <Card className="lg:col-span-2 border-border/50 bg-card/60 backdrop-blur-xl">
                <CardHeader>
                    <Skeleton className="h-6 w-24 rounded" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="h-[400px] border rounded-2xl p-4 space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                                <Skeleton className={`h-16 w-64 rounded-2xl ${i % 2 === 0 ? "rounded-tr-none" : "rounded-tl-none"} opacity-60`} />
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="h-20 flex-1 rounded-2xl opacity-60" />
                        <Skeleton className="h-10 w-10 rounded-xl self-end opacity-60" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

interface AdminSkeletonProps {
    variant: 'dashboard' | 'analytics' | 'reports' | 'table' | 'grid' | 'form' | 'support' | 'list' | 'registry';
    skeletonProps?: any;
}

export function AdminSkeleton({ variant, skeletonProps = {} }: AdminSkeletonProps) {
    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="container max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8"
        >
            <motion.div variants={item}>
                <AdminHeaderSkeleton />
            </motion.div>

            {variant === 'dashboard' && (
                <>
                    <motion.div variants={item}>
                        <AdminKpiSkeleton />
                    </motion.div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <motion.div variants={item} className="lg:col-span-2 space-y-8">
                            <AdminChartSkeleton />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <AdminChartSkeleton />
                                <AdminChartSkeleton />
                            </div>
                        </motion.div>
                        <motion.div variants={item} className="space-y-8">
                            <Card className="border-border/50 bg-primary/5 border-primary/20 p-6 h-64 rounded-2xl flex flex-col justify-center items-center">
                                <Skeleton className="h-12 w-12 rounded-full mb-4" />
                                <Skeleton className="h-6 w-40 rounded-lg mb-2" />
                                <Skeleton className="h-4 w-60 rounded-md mb-4" />
                                <Skeleton className="h-10 w-full rounded-xl" />
                            </Card>
                            <AdminFeedSkeleton />
                        </motion.div>
                    </div>
                </>
            )}

            {variant === 'analytics' && (
                <>
                    <motion.div variants={item}>
                        <AdminKpiSkeleton />
                    </motion.div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <motion.div variants={item}><AdminChartSkeleton /></motion.div>
                        <motion.div variants={item}><AdminChartSkeleton /></motion.div>
                        <motion.div variants={item}><AdminChartSkeleton /></motion.div>
                        <motion.div variants={item}><AdminChartSkeleton /></motion.div>
                    </div>
                </>
            )}

            {variant === 'reports' && (
                <>
                    <motion.div variants={item}>
                        <AdminKpiSkeleton />
                    </motion.div>
                    <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
                        <motion.div variants={item} className="lg:col-span-4"><AdminChartSkeleton /></motion.div>
                        <motion.div variants={item} className="lg:col-span-3">
                            <Card className="h-80 border-border/50 bg-card/60 backdrop-blur-xl p-6 flex flex-col items-center justify-center">
                                <Skeleton className="h-48 w-48 rounded-full mb-4" />
                                <div className="flex gap-4">
                                    <Skeleton className="h-3 w-16 rounded" />
                                    <Skeleton className="h-3 w-16 rounded" />
                                </div>
                            </Card>
                        </motion.div>
                    </div>
                    <motion.div variants={item}><AdminTableSkeleton columns={4} rows={5} /></motion.div>
                </>
            )}

            {variant === 'table' && (
                <>
                    <motion.div variants={item}>
                        <AdminFilterSkeleton />
                    </motion.div>
                    <motion.div variants={item}>
                        <AdminTableSkeleton />
                    </motion.div>
                </>
            )}

            {variant === 'form' && (
                <motion.div variants={item}>
                    <AdminFormSkeleton />
                </motion.div>
            )}

            {variant === 'grid' && (
                <>
                    <motion.div variants={item}>
                        <AdminFilterSkeleton />
                    </motion.div>
                    <motion.div variants={item}>
                        <AdminCardGridSkeleton {...skeletonProps} />
                    </motion.div>
                </>
            )}

            {variant === 'list' && (
                <motion.div variants={item}>
                    <AdminListSkeleton {...skeletonProps} />
                </motion.div>
            )}

            {variant === 'registry' && (
                <motion.div variants={item}>
                    <AdminRegistrySkeleton {...skeletonProps} />
                </motion.div>
            )}

            {variant === 'support' && (
                <motion.div variants={item}>
                    <AdminSupportSkeleton />
                </motion.div>
            )}
        </motion.div>
    );
}

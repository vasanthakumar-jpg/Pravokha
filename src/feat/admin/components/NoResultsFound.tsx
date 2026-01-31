import { SearchX, FilterX, RotateCcw } from "lucide-react";
import { Button } from "@/ui/Button";
import { cn } from "@/lib/utils";

interface NoResultsFoundProps {
    title?: string;
    description?: string;
    onReset?: () => void;
    searchTerm?: string;
    className?: string;
    icon?: "search" | "filter";
}

export function NoResultsFound({
    title = "No matches found",
    description = "We couldn't find any results matching your current filters or search criteria.",
    onReset,
    searchTerm,
    className,
    icon = "search"
}: NoResultsFoundProps) {
    return (
        <div className={cn(
            "flex flex-col items-center justify-center p-12 text-center rounded-2xl border-2 border-dashed border-border/40 bg-muted/20 animate-in fade-in zoom-in duration-300",
            className
        )}>
            <div className="relative mb-6">
                <div className="absolute -inset-4 bg-primary/5 rounded-full blur-2xl animate-pulse" />
                <div className="relative h-20 w-20 rounded-full bg-background border border-border/60 flex items-center justify-center shadow-lg">
                    {icon === "search" ? (
                        <SearchX className="h-10 w-10 text-muted-foreground/40" />
                    ) : (
                        <FilterX className="h-10 w-10 text-muted-foreground/40" />
                    )}
                </div>
            </div>

            <h3 className="text-xl font-bold tracking-tight mb-2">
                {searchTerm ? `No results for "${searchTerm}"` : title}
            </h3>
            <p className="max-w-[320px] text-sm text-muted-foreground leading-relaxed mb-8">
                {description}
            </p>

            {onReset && (
                <Button
                    variant="outline"
                    onClick={onReset}
                    className="h-10 px-6 rounded-xl border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary font-bold transition-all"
                >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Clear all filters
                </Button>
            )}
        </div>
    );
}

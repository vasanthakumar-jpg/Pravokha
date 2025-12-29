import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { RotateCw, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
import styles from "./ProductView360.module.css";
import { cn } from "@/lib/utils";

interface ProductView360Props {
    images: string[];
    open: boolean;
    onClose: () => void;
}

export function ProductView360({ images, open, onClose }: ProductView360Props) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) {
            setCurrentIndex(0);
        }
    }, [open]);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setStartX(e.clientX);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;

        const diff = e.clientX - startX;
        const sensitivity = 5;

        if (Math.abs(diff) > sensitivity) {
            const direction = diff > 0 ? -1 : 1;
            const steps = Math.floor(Math.abs(diff) / sensitivity);

            setCurrentIndex((prev) => {
                const newIndex = prev + (direction * steps);
                if (newIndex < 0) return images.length + (newIndex % images.length);
                return newIndex % images.length;
            });
            setStartX(e.clientX);
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        setIsDragging(true);
        setStartX(e.touches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;

        const diff = e.touches[0].clientX - startX;
        const sensitivity = 5;

        if (Math.abs(diff) > sensitivity) {
            const direction = diff > 0 ? -1 : 1;
            const steps = Math.floor(Math.abs(diff) / sensitivity);

            setCurrentIndex((prev) => {
                const newIndex = prev + (direction * steps);
                if (newIndex < 0) return images.length + (newIndex % images.length);
                return newIndex % images.length;
            });
            setStartX(e.touches[0].clientX);
        }
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className={styles.container}>
                <div className={styles.viewWrapper}>
                    <div className={styles.infoBadge}>
                        <RotateCw className={cn(styles.infoIcon, "animate-spin")} style={{ animationDuration: '3s' }} />
                        <span className={styles.infoText}>Drag to rotate 360°</span>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        className={styles.closeButton}
                        onClick={onClose}
                    >
                        <X className="h-4 w-4" />
                    </Button>

                    <div
                        ref={containerRef}
                        className={styles.viewArea}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        <img
                            src={images[currentIndex]}
                            alt={`360° view ${currentIndex + 1}`}
                            className={styles.image}
                            draggable={false}
                        />
                    </div>

                    <div className={styles.counter}>
                        <span className={styles.counterText}>
                            {currentIndex + 1} / {images.length}
                        </span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default ProductView360;

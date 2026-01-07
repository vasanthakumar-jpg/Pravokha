import { useState } from "react";
import { Dialog, DialogContent } from "@/ui/Dialog";
import { Button } from "@/ui/Button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./ImageViewer.module.css";
import { cn } from "@/lib/utils";

interface ImageViewerProps {
    images: string[];
    currentIndex: number;
    open: boolean;
    onClose: () => void;
}

export function ImageViewer({ images, currentIndex, open, onClose }: ImageViewerProps) {
    const [index, setIndex] = useState(currentIndex);

    const handlePrevious = () => {
        setIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const handleNext = () => {
        setIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className={styles.dialogContent} onInteractOutside={onClose}>
                {/* Main Image Section */}
                <div className={styles.mainImageContainer}>
                    <img
                        src={images[index]}
                        alt={`Product image ${index + 1}`}
                        className={styles.mainImage}
                    />

                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(styles.navButton, styles.prevButton)}
                        onClick={handlePrevious}
                    >
                        <ChevronLeft className={styles.navIcon} />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(styles.navButton, styles.nextButton)}
                        onClick={handleNext}
                    >
                        <ChevronRight className={styles.navIcon} />
                    </Button>
                </div>

                {/* Thumbnail Section */}
                <div className={styles.thumbnailContainer}>
                    {images.map((img, i) => (
                        <button
                            key={i}
                            onClick={() => setIndex(i)}
                            className={cn(
                                styles.thumbnailButton,
                                i === index ? styles.thumbnailActive : styles.thumbnailInactive
                            )}
                        >
                            <img src={img} alt={`Thumbnail ${i + 1}`} className={styles.thumbnailImage} />
                        </button>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}

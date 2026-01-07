import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/ui/Dialog";
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
                <DialogTitle className="sr-only">Product Image Viewer</DialogTitle>
                <DialogDescription className="sr-only">
                    View larger version of product images and navigate through them.
                </DialogDescription>
                {/* Main Image Section */}
                <div className={styles.mainSection}>
                    <img
                        src={images[index]}
                        alt={`Product image ${index + 1}`}
                        className={styles.mainImage}
                    />

                    <Button
                        variant="ghost"
                        size="icon"
                        className={styles.prevButton}
                        onClick={handlePrevious}
                    >
                        <ChevronLeft className="h-8 w-8" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className={styles.nextButton}
                        onClick={handleNext}
                    >
                        <ChevronRight className="h-8 w-8" />
                    </Button>
                </div>

                {/* Thumbnail Section */}
                <div className={styles.thumbnailSection}>
                    {images.map((img, i) => (
                        <button
                            key={i}
                            onClick={() => setIndex(i)}
                            className={cn(
                                styles.thumbnailButton,
                                i === index && styles.thumbnailActive
                            )}
                        >
                            <img src={img} alt={`Thumbnail ${i + 1}`} className={styles.thumbnailImg} />
                        </button>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default ImageViewer;

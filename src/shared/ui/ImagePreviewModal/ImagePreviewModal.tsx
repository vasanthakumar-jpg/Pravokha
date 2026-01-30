import { useState } from "react";
import { Dialog, DialogContent, DialogClose } from "@/ui/Dialog";
import { Button } from "@/ui/Button";
import { X, ZoomIn, ZoomOut, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImagePreviewModalProps {
    images: string[];
    initialIndex: number;
    isOpen: boolean;
    onClose: () => void;
}

export function ImagePreviewModal({ images, initialIndex, isOpen, onClose }: ImagePreviewModalProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [zoom, setZoom] = useState(1);

    const currentImage = images[currentIndex];

    const handlePrevious = () => {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
        setZoom(1);
    };

    const handleNext = () => {
        setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
        setZoom(1);
    };

    const handleZoomIn = () => {
        setZoom((prev) => Math.min(prev + 0.25, 3));
    };

    const handleZoomOut = () => {
        setZoom((prev) => Math.max(prev - 0.25, 0.5));
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = currentImage;
        link.download = `image-${currentIndex + 1}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden bg-background/95 backdrop-blur-sm">
                {/* Header Controls */}
                <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-background/80 to-transparent">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">
                            {currentIndex + 1} / {images.length}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleZoomOut}
                            disabled={zoom <= 0.5}
                            className="h-8 w-8 bg-background/80 backdrop-blur-sm"
                        >
                            <ZoomOut className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleZoomIn}
                            disabled={zoom >= 3}
                            className="h-8 w-8 bg-background/80 backdrop-blur-sm"
                        >
                            <ZoomIn className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleDownload}
                            className="h-8 w-8 bg-background/80 backdrop-blur-sm"
                        >
                            <Download className="h-4 w-4" />
                        </Button>
                        <DialogClose asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 bg-background/80 backdrop-blur-sm"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </DialogClose>
                    </div>
                </div>

                {/* Image Container */}
                <div className="relative w-full h-[90vh] flex items-center justify-center overflow-auto p-12">
                    <img
                        src={currentImage}
                        alt={`Preview ${currentIndex + 1}`}
                        className="max-w-full max-h-full object-contain transition-transform duration-200"
                        style={{ transform: `scale(${zoom})` }}
                    />
                </div>

                {/* Navigation Controls */}
                {images.length > 1 && (
                    <>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handlePrevious}
                            className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-background/80 backdrop-blur-sm shadow-lg hover:scale-110 transition-transform"
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleNext}
                            className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-background/80 backdrop-blur-sm shadow-lg hover:scale-110 transition-transform"
                        >
                            <ChevronRight className="h-6 w-6" />
                        </Button>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}

export default ImagePreviewModal;

import { useState, useEffect } from "react";
import { Star, Upload, X, Edit, Trash2, Check } from "lucide-react";
import { Button } from "@/ui/Button";
import { Textarea } from "@/ui/Textarea";
import { Input } from "@/ui/Input";
import { Card } from "@/ui/Card";
import { supabase } from "@/infra/api/supabase";
import { toast } from "sonner";
import { LoadingSpinner } from "@/shared/ui/LoadingSpinner";
import styles from "./ProductReviews.module.css";
import { cn } from "@/lib/utils";

interface ProductReviewsProps {
    productId: string;
}

interface Review {
    id: string;
    user_id: string;
    rating: number;
    title: string;
    comment: string;
    images?: string[];
    created_at: string;
    status: string;
}

export const ProductReviews = ({ productId }: ProductReviewsProps) => {
    const [user, setUser] = useState<any>(null);
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [title, setTitle] = useState("");
    const [reviewText, setReviewText] = useState("");
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingReview, setEditingReview] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<{
        title?: string;
        reviewText?: string;
        rating?: string;
    }>({});

    useEffect(() => {
        checkUser();
        fetchReviews();
    }, [productId]);

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
    };

    const fetchReviews = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from("reviews")
                .select("*")
                .eq("product_id", productId)
                .eq("status", "approved")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setReviews(data || []);
        } catch (error) {
            console.error("Error fetching reviews:", error);
            toast.error("Failed to load reviews");
        } finally {
            setIsLoading(false);
        }
    };

    const validateForm = () => {
        const errors: typeof validationErrors = {};

        if (!rating) {
            errors.rating = "Please select a rating";
        }
        if (!title.trim()) {
            errors.title = "Title is required";
        } else if (title.length < 3) {
            errors.title = "Title must be at least 3 characters";
        } else if (title.length > 100) {
            errors.title = "Title must be less than 100 characters";
        }
        if (!reviewText.trim()) {
            errors.reviewText = "Review text is required";
        } else if (reviewText.length < 10) {
            errors.reviewText = "Review must be at least 10 characters";
        } else if (reviewText.length > 1000) {
            errors.reviewText = "Review must be less than 1000 characters";
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);

            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            const invalidFiles = files.filter(file => !validTypes.includes(file.type));

            if (invalidFiles.length > 0) {
                toast.error("Please upload only JPG, PNG, or WebP images");
                return;
            }

            const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);

            if (oversizedFiles.length > 0) {
                toast.error("Each image must be less than 5MB");
                return;
            }

            if (files.length + selectedImages.length > 3) {
                toast.error("You can upload up to 3 images only");
                return;
            }

            setSelectedImages(prev => [...prev, ...files]);
        }
    };

    const removeImage = (index: number) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
    };

    const uploadImagesToStorage = async (files: File[]) => {
        const uploadedUrls: string[] = [];

        for (const file of files) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${Date.now()}-${Math.random()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('review-images')
                .upload(fileName, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('review-images')
                .getPublicUrl(fileName);

            uploadedUrls.push(publicUrl);
        }

        return uploadedUrls;
    };

    const handleSubmitReview = async () => {
        if (!user) {
            toast.error("Please sign in to leave a review");
            return;
        }

        if (!validateForm()) {
            toast.error("Please fix the errors before submitting");
            return;
        }

        setIsSubmitting(true);

        try {
            let imageUrls: string[] = [];

            if (selectedImages.length > 0) {
                imageUrls = await uploadImagesToStorage(selectedImages);
            }

            const reviewData = {
                user_id: user.id,
                product_id: productId,
                rating,
                title: title.trim(),
                comment: reviewText.trim(),
                images: imageUrls.length > 0 ? imageUrls : null,
                status: "approved",
            };

            if (editingReview) {
                const { error } = await supabase
                    .from("reviews")
                    .update(reviewData)
                    .eq("id", editingReview);

                if (error) throw error;
                toast.success("Review updated successfully");
                setEditingReview(null);
            } else {
                const { error } = await supabase.from("reviews").insert([reviewData]);

                if (error) throw error;
                toast.success("Review submitted successfully");
            }

            setRating(0);
            setTitle("");
            setReviewText("");
            setSelectedImages([]);
            setValidationErrors({});

            fetchReviews();
        } catch (error: any) {
            console.error("Error submitting review:", error);
            toast.error(error.message || "Failed to submit review");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditReview = (review: Review) => {
        setEditingReview(review.id);
        setRating(review.rating);
        setTitle(review.title);
        setReviewText(review.comment);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDeleteReview = async (reviewId: string) => {
        if (!confirm("Are you sure you want to delete this review?")) return;

        try {
            const { error } = await supabase
                .from("reviews")
                .delete()
                .eq("id", reviewId);

            if (error) throw error;

            toast.success("Review deleted successfully");
            fetchReviews();
        } catch (error) {
            console.error("Error deleting review:", error);
            toast.error("Failed to delete review");
        }
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="space-y-8">
            {user ? (
                <Card className={styles.formCard}>
                    <h3 className={styles.formTitle}>
                        {editingReview ? "Edit Your Review" : "Write a Review"}
                    </h3>

                    {/* Rating */}
                    <div className={styles.ratingContainer}>
                        <label className={styles.label}>Rating *</label>
                        <div className={styles.starsRow}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => {
                                        setRating(star);
                                        setValidationErrors(prev => ({ ...prev, rating: undefined }));
                                    }}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    className={styles.starButton}
                                >
                                    <Star
                                        className={cn(
                                            styles.starIcon,
                                            star <= (hoverRating || rating)
                                                ? "fill-[#146B6B] text-[#146B6B]"
                                                : "text-muted"
                                        )}
                                    />
                                </button>
                            ))}
                        </div>
                        {validationErrors.rating && (
                            <p className={styles.error}>{validationErrors.rating}</p>
                        )}
                    </div>

                    {/* Title */}
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Review Title *</label>
                        <Input
                            value={title}
                            onChange={(e) => {
                                setTitle(e.target.value);
                                setValidationErrors(prev => ({ ...prev, title: undefined }));
                            }}
                            placeholder="Summarize your experience"
                            maxLength={100}
                            className={cn(
                                validationErrors.title && "border-destructive focus-visible:ring-destructive",
                                title && !validationErrors.title && "border-success focus-visible:ring-success"
                            )}
                        />
                        {validationErrors.title && (
                            <p className={styles.error}>{validationErrors.title}</p>
                        )}
                        {title && !validationErrors.title && (
                            <p className={styles.success}>
                                <Check className="h-3 w-3" /> Looks good!
                            </p>
                        )}
                    </div>

                    {/* Review Text */}
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Your Review *</label>
                        <div className={styles.textAreaContainer}>
                            <Textarea
                                value={reviewText}
                                onChange={(e) => {
                                    setReviewText(e.target.value);
                                    setValidationErrors(prev => ({ ...prev, reviewText: undefined }));
                                }}
                                placeholder="Share your thoughts about the product..."
                                rows={5}
                                maxLength={1000}
                                className={cn(
                                    validationErrors.reviewText && "border-destructive focus-visible:ring-destructive",
                                    reviewText && !validationErrors.reviewText && "border-success focus-visible:ring-success"
                                )}
                            />
                            <div className="flex justify-between items-center mt-1">
                                <div>
                                    {validationErrors.reviewText && (
                                        <p className={styles.error}>{validationErrors.reviewText}</p>
                                    )}
                                    {reviewText && !validationErrors.reviewText && (
                                        <p className={styles.success}>
                                            <Check className="h-3 w-3" /> Looks good!
                                        </p>
                                    )}
                                </div>
                                <p className={styles.charCount}>{reviewText.length}/1000</p>
                            </div>
                        </div>
                    </div>

                    {/* Image Upload */}
                    <div className={styles.imageUploadSection}>
                        <label className={styles.label}>
                            Add Photos (Optional - Max 3, JPG/PNG/WebP, 5MB each)
                        </label>
                        <div className={styles.imageGrid}>
                            {selectedImages.map((file, index) => (
                                <div key={index} className={styles.imagePreview}>
                                    <img
                                        src={URL.createObjectURL(file)}
                                        alt={`Preview ${index + 1}`}
                                        className={styles.previewImg}
                                    />
                                    <button
                                        onClick={() => removeImage(index)}
                                        className={styles.removeImgButton}
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                            {selectedImages.length < 3 && (
                                <label className={styles.uploadLabel}>
                                    <Upload className={styles.uploadIcon} />
                                    <span className={styles.uploadText}>Upload</span>
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/jpg,image/png,image/webp"
                                        multiple
                                        className="hidden"
                                        onChange={handleImageUpload}
                                    />
                                </label>
                            )}
                        </div>
                    </div>

                    <div className={styles.submitActions}>
                        <Button
                            onClick={handleSubmitReview}
                            disabled={isSubmitting}
                            className="w-full md:w-auto"
                        >
                            {isSubmitting ? "Submitting..." : editingReview ? "Update Review" : "Submit Review"}
                        </Button>
                        {editingReview && (
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setEditingReview(null);
                                    setRating(0);
                                    setTitle("");
                                    setReviewText("");
                                    setSelectedImages([]);
                                    setValidationErrors({});
                                }}
                            >
                                Cancel
                            </Button>
                        )}
                    </div>
                </Card>
            ) : (
                <Card className="p-6 text-center">
                    <p className="text-muted-foreground">Please sign in to leave a review</p>
                </Card>
            )}

            {/* Reviews List */}
            <div className={styles.reviewsListSection}>
                <h3 className={styles.reviewsTitle}>Customer Reviews</h3>

                {reviews.length > 0 ? (
                    reviews.map((review) => (
                        <Card key={review.id} className={styles.reviewCard}>
                            <div className={styles.reviewHeader}>
                                <div className={styles.reviewStars}>
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                            key={i}
                                            className={cn(
                                                styles.reviewStarIcon,
                                                i < review.rating
                                                    ? "fill-[#146B6B] text-[#146B6B]"
                                                    : "text-muted"
                                            )}
                                        />
                                    ))}
                                </div>
                                {user && user.id === review.user_id && (
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEditReview(review)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteReview(review.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <h4 className={styles.reviewTitle}>{review.title}</h4>
                            <p className={styles.reviewComment}>{review.comment}</p>

                            {review.images && review.images.length > 0 && (
                                <div className={styles.reviewImages}>
                                    {review.images.map((imageUrl, index) => (
                                        <img
                                            key={index}
                                            src={imageUrl}
                                            alt={`Review image ${index + 1}`}
                                            className={styles.reviewImgThumb}
                                            loading="lazy"
                                            onClick={() => window.open(imageUrl, '_blank')}
                                        />
                                    ))}
                                </div>
                            )}

                            <p className={styles.reviewDate}>
                                {new Date(review.created_at).toLocaleDateString()}
                            </p>
                        </Card>
                    ))
                ) : (
                    <Card className="p-6 text-center">
                        <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
                    </Card>
                )}
            </div>
        </div>
    );
};

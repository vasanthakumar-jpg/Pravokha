import { useState } from "react";
import { Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { Label } from "@/ui/Label";
import { Textarea } from "@/ui/Textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/Card";
import { toast } from "@/shared/hook/use-toast";
import { apiClient } from "@/infra/api/apiClient";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { APP_CONFIG } from "@/core/config/appConfig";

const contactSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    email: z.string().email("Invalid email address").max(255),
    phone: z.string().regex(/^[0-9]{10}$/, "Phone must be 10 digits").optional().or(z.literal("")),
    subject: z.string().min(5, "Subject must be at least 5 characters").max(200),
    message: z.string().min(10, "Message must be at least 10 characters").max(1000),
});

export function ContactPage() {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateField = (name: string, value: string) => {
        try {
            if (name === "name") {
                z.string().min(2, "Name must be at least 2 characters").max(100).parse(value);
            } else if (name === "email") {
                z.string().email("Invalid email address").max(255).parse(value);
            } else if (name === "phone" && value) {
                z.string().regex(/^[0-9]{10}$/, "Phone must be 10 digits").parse(value);
            } else if (name === "subject") {
                z.string().min(5, "Subject must be at least 5 characters").max(200).parse(value);
            } else if (name === "message") {
                z.string().min(10, "Message must be at least 10 characters").max(1000).parse(value);
            }
            setErrors((prev) => ({ ...prev, [name]: "" }));
            return true;
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                setErrors((prev) => ({ ...prev, [name]: error.errors[0].message }));
            }
            return false;
        }
    };

    const handleChange = (name: string, value: string) => {
        setFormData({ ...formData, [name]: value });
        if (value) validateField(name, value);
        else setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            contactSchema.parse(formData);
            setErrors({});
            setLoading(true);

            await apiClient.post("/support/contact", formData);

            toast({
                title: "Message sent!",
                description: "We'll get back to you as soon as possible.",
            });

            setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                const fieldErrors: Record<string, string> = {};
                error.errors.forEach((err) => {
                    if (err.path[0]) {
                        fieldErrors[err.path[0] as string] = err.message;
                    }
                });
                setErrors(fieldErrors);
                toast({
                    title: "Validation Error",
                    description: "Please check the form for errors",
                    variant: "destructive",
                });
            } else {
                const msg = error.response?.data?.message || "Failed to send message. Please try again.";
                toast({
                    title: "Error",
                    description: msg,
                    variant: "destructive",
                });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full py-6 sm:py-8 px-4 sm:px-6">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 text-center">Contact Us</h1>
                <p className="text-muted-foreground text-center mb-6 sm:mb-8 md:mb-12 text-sm sm:text-base md:text-lg">
                    Have a question? We'd love to hear from you.
                </p>

                <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
                    <div>
                        <Card>
                            <CardHeader className="p-4 sm:p-6">
                                <CardTitle className="text-lg sm:text-xl md:text-2xl">Send us a message</CardTitle>
                                <CardDescription className="text-xs sm:text-sm">
                                    Fill out the form and we'll get back to you within 24 hours.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-6">
                                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                                    <div>
                                        <Label htmlFor="name">Name *</Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) => handleChange("name", e.target.value)}
                                            onBlur={(e) => validateField("name", e.target.value)}
                                            placeholder="John Doe"
                                            className={cn(errors.name && "border-destructive focus-visible:ring-destructive")}
                                            required
                                        />
                                        {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
                                    </div>
                                    <div>
                                        <Label htmlFor="email">Email *</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => handleChange("email", e.target.value)}
                                            onBlur={(e) => validateField("email", e.target.value)}
                                            placeholder="you@example.com"
                                            className={cn(errors.email && "border-destructive focus-visible:ring-destructive")}
                                            required
                                        />
                                        {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
                                    </div>
                                    <div>
                                        <Label htmlFor="phone">Phone</Label>
                                        <Input
                                            id="phone"
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => handleChange("phone", e.target.value)}
                                            onBlur={(e) => e.target.value && validateField("phone", e.target.value)}
                                            placeholder="9876543210"
                                            className={cn(errors.phone && "border-destructive focus-visible:ring-destructive")}
                                        />
                                        {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone}</p>}
                                    </div>
                                    <div>
                                        <Label htmlFor="subject">Subject *</Label>
                                        <Input
                                            id="subject"
                                            value={formData.subject}
                                            onChange={(e) => handleChange("subject", e.target.value)}
                                            onBlur={(e) => validateField("subject", e.target.value)}
                                            placeholder="What is this regarding?"
                                            className={cn(errors.subject && "border-destructive focus-visible:ring-destructive")}
                                            required
                                        />
                                        {errors.subject && <p className="text-sm text-destructive mt-1">{errors.subject}</p>}
                                    </div>
                                    <div>
                                        <Label htmlFor="message">Message *</Label>
                                        <Textarea
                                            id="message"
                                            value={formData.message}
                                            onChange={(e) => handleChange("message", e.target.value)}
                                            onBlur={(e) => validateField("message", e.target.value)}
                                            placeholder="How can we help you?"
                                            rows={5}
                                            className={cn("resize-none", errors.message && "border-destructive focus-visible:ring-destructive")}
                                            required
                                        />
                                        {errors.message && <p className="text-sm text-destructive mt-1">{errors.message}</p>}
                                    </div>
                                    <Button type="submit" className="w-full" disabled={loading}>
                                        {loading ? "Sending..." : "Send Message"}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader className="p-4 sm:p-6">
                                <CardTitle className="text-lg sm:text-xl md:text-2xl">Contact Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
                                <div className="flex items-start gap-2 sm:gap-3">
                                    <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5 flex-shrink-0" />
                                    <div className="min-w-0">
                                        <p className="font-medium text-sm sm:text-base">Email</p>
                                        <a
                                            href={`mailto:${APP_CONFIG.SUPPORT_EMAIL}`}
                                            className="text-xs sm:text-sm text-muted-foreground hover:text-primary break-all"
                                        >
                                            {APP_CONFIG.SUPPORT_EMAIL}
                                        </a>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2 sm:gap-3">
                                    <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-medium text-sm sm:text-base">Phone</p>
                                        <a href={`tel:${APP_CONFIG.SUPPORT_PHONE}`} className="text-xs sm:text-sm text-muted-foreground hover:text-primary block">
                                            {APP_CONFIG.SUPPORT_PHONE}
                                        </a>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2 sm:gap-3">
                                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-medium text-sm sm:text-base">Address</p>
                                        <p className="text-xs sm:text-sm text-muted-foreground">
                                            {APP_CONFIG.ADDRESS}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="p-4 sm:p-6">
                                <CardTitle className="text-lg sm:text-xl md:text-2xl">Business Hours</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 p-4 sm:p-6">
                                <div className="flex justify-between gap-2">
                                    <span className="text-xs sm:text-sm text-muted-foreground">Monday - Sunday</span>
                                    <span className="text-xs sm:text-sm font-medium">9:00 AM - 9:00 PM</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ContactPage;

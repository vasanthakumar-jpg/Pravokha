import { useState } from "react";
import { Mail, Phone, LifeBuoy, HelpCircle, MessageSquare, Send, CheckCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/Card";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { Textarea } from "@/ui/Textarea";
import { Link } from "react-router-dom";
import { useAuth } from "@/core/context/AuthContext";
import { apiClient } from "@/infra/api/apiClient";
import { toast } from "@/shared/hook/use-toast";
import { cn } from "@/lib/utils";
import { z } from "zod";

const contactSchema = z.object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().optional(),
    subject: z.string().min(5, "Subject must be at least 5 characters"),
    message: z.string().min(10, "Message must be at least 10 characters"),
});

export function SupportPage() {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        name: user?.name || "",
        email: user?.email || "",
        phone: "",
        subject: "",
        message: "",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        try {
            contactSchema.parse(formData);
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                const newErrors: Record<string, string> = {};
                error.errors.forEach((err) => {
                    if (err.path[0]) {
                        newErrors[err.path[0] as string] = err.message;
                    }
                });
                setErrors(newErrors);
            }
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await apiClient.post("/support/contact", formData);
            if (response.data.success) {
                setIsSuccess(true);
                toast({
                    title: "Message Sent",
                    description: "We've received your message and will get back to you shortly.",
                });
                setFormData({ ...formData, phone: "", subject: "", message: "" });
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to send message. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto space-y-8 sm:space-y-12">

                {/* Header */}
                <div className="text-center space-y-4">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">Support Center</h1>
                    <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base md:text-lg">
                        Need help? We're here for you. Choose a support option below or send us a message directly.
                    </p>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Column: Quick Actions & Info */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Ticket System Card */}
                        <Card className="border-primary/20 shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                                    <LifeBuoy className="h-5 w-5 text-primary" />
                                    Support Portal
                                </CardTitle>
                                <CardDescription>
                                    Track requests and get faster resolution.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {user ? (
                                    <>
                                        <Link to="/tickets" className="block">
                                            <Button className="w-full justify-start" variant="outline">
                                                <MessageSquare className="mr-2 h-4 w-4" />
                                                View My Tickets
                                            </Button>
                                        </Link>
                                        <Link to="/tickets/new" className="block">
                                            <Button className="w-full justify-start">
                                                <LifeBuoy className="mr-2 h-4 w-4" />
                                                Create New Ticket
                                            </Button>
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-sm text-muted-foreground mb-2">Log in to create and track support tickets.</p>
                                        <Link to="/auth">
                                            <Button className="w-full">Login to Support</Button>
                                        </Link>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Contact Info Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg sm:text-xl">Contact Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm sm:text-base">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-full text-primary">
                                        <Phone className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Phone Support</p>
                                        <a href="tel:+917339232817" className="text-muted-foreground hover:text-primary transition-colors">
                                            +91 73392 32817
                                        </a>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-full text-primary">
                                        <Mail className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Email Us</p>
                                        <a href="mailto:support@pravokha.com" className="text-muted-foreground hover:text-primary transition-colors">
                                            support@pravokha.com
                                        </a>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-full text-primary">
                                        <HelpCircle className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="font-medium">FAQ</p>
                                        <Link to="/faq" className="text-muted-foreground hover:text-primary transition-colors">
                                            Browse Frequently Asked Questions
                                        </Link>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Contact Form */}
                    <div className="lg:col-span-2">
                        <Card className="h-full border-primary/10">
                            <CardHeader>
                                <CardTitle className="text-xl sm:text-2xl">Send us a Message</CardTitle>
                                <CardDescription>
                                    Fill out the form below and our team will get back to you within 24 hours.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isSuccess ? (
                                    <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 animate-in fade-in zoom-in duration-300">
                                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                            <CheckCircle className="h-8 w-8" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-semibold text-foreground">Message Sent!</h3>
                                            <p className="text-muted-foreground mt-2">
                                                Thank you for contacting us. We will review your message and respond shortly.
                                            </p>
                                        </div>
                                        <Button onClick={() => setIsSuccess(false)} variant="outline" className="mt-4">
                                            Send Another Message
                                        </Button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div className="grid sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Your Name</label>
                                                <Input
                                                    placeholder="John Doe"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    disabled={isSubmitting}
                                                    className={errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
                                                />
                                                {errors.name && <p className="text-[10px] font-bold text-red-500 animate-in fade-in slide-in-from-top-1">{errors.name}</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Email Address</label>
                                                <Input
                                                    type="email"
                                                    placeholder="john@example.com"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    disabled={isSubmitting}
                                                    className={errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
                                                />
                                                {errors.email && <p className="text-[10px] font-bold text-red-500 animate-in fade-in slide-in-from-top-1">{errors.email}</p>}
                                            </div>
                                        </div>

                                        <div className="grid sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Phone Number (Optional)</label>
                                                <Input
                                                    placeholder="+91 00000 00000"
                                                    value={formData.phone}
                                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                    disabled={isSubmitting}
                                                    className={errors.phone ? "border-red-500 focus-visible:ring-red-500" : ""}
                                                />
                                                {errors.phone && <p className="text-[10px] font-bold text-red-500 animate-in fade-in slide-in-from-top-1">{errors.phone}</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Subject</label>
                                                <Input
                                                    placeholder="What can we help you with?"
                                                    value={formData.subject}
                                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                                    disabled={isSubmitting}
                                                    className={errors.subject ? "border-red-500 focus-visible:ring-red-500" : ""}
                                                />
                                                {errors.subject && <p className="text-[10px] font-bold text-red-500 animate-in fade-in slide-in-from-top-1">{errors.subject}</p>}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Message</label>
                                            <Textarea
                                                placeholder="Please describe your issue or inquiry in detail..."
                                                className={cn("min-h-[150px] resize-y", errors.message && "border-red-500 focus-visible:ring-red-500")}
                                                value={formData.message}
                                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                                disabled={isSubmitting}
                                            />
                                            {errors.message && <p className="text-[10px] font-bold text-red-500 animate-in fade-in slide-in-from-top-1">{errors.message}</p>}
                                        </div>

                                        <Button type="submit" className="w-full sm:w-auto font-bold h-11 px-8 rounded-xl" disabled={isSubmitting}>
                                            {isSubmitting ? (
                                                <span className="flex items-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin" /> Sending...
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-2">
                                                    Send Message <Send className="h-4 w-4" />
                                                </span>
                                            )}
                                        </Button>
                                    </form>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SupportPage;

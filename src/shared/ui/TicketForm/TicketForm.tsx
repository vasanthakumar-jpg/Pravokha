import { useState } from "react";
import { Button } from "@/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/Card";
import { Input } from "@/ui/Input";
import { Label } from "@/ui/Label";
import { Textarea } from "@/ui/Textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/Select";
import { toast } from "@/shared/hook/use-toast";
import { supabase } from "@/infra/api/supabase";
import { useAuth } from "@/core/context/AuthContext";
import { Loader2, Upload, X, ShieldAlert } from "lucide-react";
import { Badge } from "@/ui/Badge";
import styles from "./TicketForm.module.css";
import { cn } from "@/lib/utils";

interface TicketFormProps {
    onSuccess?: () => void;
    initialType?: string;
}

export function TicketForm({ onSuccess, initialType = "suspension_appeal" }: TicketFormProps) {
    const { user, isSuspended } = useAuth();
    const [loading, setLoading] = useState(false);

    const categories = [
        { value: "suspension_appeal", label: "Suspension Appeal", suspendedAllowed: true },
        { value: "account_verification", label: "Account Verification", suspendedAllowed: true },
        { value: "compliance_review", label: "Compliance Review", suspendedAllowed: true },
        { value: "payout_issue", label: "Payment Hold / Payout Issue", suspendedAllowed: true },
        { value: "general_support", label: "General Support", suspendedAllowed: false },
        { value: "technical_issue", label: "Technical Issue", suspendedAllowed: false },
        { value: "billing", label: "Billing / Order dispute", suspendedAllowed: false },
        { value: "listing_issue", label: "Product Listing Issue", suspendedAllowed: false },
    ];

    const allowedCategories = isSuspended
        ? categories.filter(cat => cat.suspendedAllowed)
        : categories;

    const [formData, setFormData] = useState({
        type: isSuspended ? "suspension_appeal" : initialType,
        subject: "",
        description: "",
        priority: "medium"
    });

    const [files, setFiles] = useState<File[]>([]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast({ title: "Error", description: "You must be logged in", variant: "destructive" });
            return;
        }

        setLoading(true);

        try {
            const evidenceUrls: string[] = [];

            for (const file of files) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${user.id}/${Date.now()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('ticket-evidence')
                    .upload(fileName, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('ticket-evidence')
                    .getPublicUrl(fileName);

                evidenceUrls.push(publicUrl);
            }

            const { error } = await (supabase as any)
                .from('support_tickets')
                .insert({
                    user_id: user.id,
                    type: formData.type,
                    subject: formData.subject,
                    description: formData.description,
                    priority: formData.priority,
                    evidence_urls: evidenceUrls.length > 0 ? evidenceUrls : null
                });

            if (error) throw error;

            try {
                const { data: admins } = await supabase
                    .from("users")
                    .select('user_id')
                    .eq('role', 'admin');

                if (admins && admins.length > 0) {
                    const adminNotifications = admins.map(admin => ({
                        user_id: admin.user_id,
                        title: "New Support Ticket",
                        message: `A new ${formData.type.replace('_', ' ')} ticket has been submitted by ${user.email}.`,
                        type: 'alert',
                        link: '/admin/tickets',
                        is_read: false
                    }));

                    await supabase
                        .from('notifications')
                        .insert(adminNotifications);
                }
            } catch (notifyError) {
                console.warn('Failed to notify admins:', notifyError);
            }

            toast({
                title: "Success",
                description: "Your ticket has been submitted. We'll review it shortly."
            });

            setFormData({
                type: initialType,
                subject: "",
                description: "",
                priority: "medium"
            });
            setFiles([]);

            onSuccess?.();

        } catch (error: any) {
            console.error('Error submitting ticket:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to submit ticket",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setFiles(prev => [...prev, ...newFiles].slice(0, 5));
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <Card className={styles.card}>
            <CardHeader>
                <CardTitle className={styles.headerContainer}>
                    Submit Support Ticket
                    {isSuspended && <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">Limited Access</Badge>}
                </CardTitle>
                <CardDescription>
                    {isSuspended
                        ? "Support access is currently limited to appeals and compliance. Provide detailed documentation for review."
                        : "Describe your issue in detail. Our team will review and respond within 24-48 hours."}
                </CardDescription>
                {isSuspended && (
                    <div className={styles.governanceNotice}>
                        <span className={styles.governanceTitle}>Governance Insight:</span>
                        <span>Commerce-related support is restricted while your account is suspended. Use this portal for compliance and appeals only.</span>
                    </div>
                )}
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className={styles.formGrid}>
                    <div className={styles.field}>
                        <Label htmlFor="type">Ticket Type</Label>
                        <Select
                            value={formData.type}
                            onValueChange={(value) => setFormData({ ...formData, type: value })}
                        >
                            <SelectTrigger id="type">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {allowedCategories.map(cat => (
                                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className={styles.field}>
                        <Label htmlFor="priority">Priority</Label>
                        <Select
                            value={formData.priority}
                            onValueChange={(value) => setFormData({ ...formData, priority: value })}
                        >
                            <SelectTrigger id="priority">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className={styles.field}>
                        <Label htmlFor="subject">Subject</Label>
                        <Input
                            id="subject"
                            placeholder="Brief description of your issue"
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            required
                            maxLength={200}
                        />
                    </div>

                    <div className={styles.field}>
                        <Label htmlFor="description">Detailed Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Please provide as much detail as possible..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            required
                            rows={6}
                            maxLength={2000}
                        />
                        <p className={styles.charCount}>
                            {formData.description.length}/2000 characters
                        </p>
                    </div>

                    <div className={styles.uploadWrapper}>
                        <Label htmlFor="evidence">Evidence/Attachments (Optional)</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                id="evidence"
                                type="file"
                                onChange={handleFileChange}
                                accept="image/*,application/pdf"
                                multiple
                                className="hidden"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => document.getElementById('evidence')?.click()}
                                disabled={files.length >= 5}
                            >
                                <div className={styles.uploadButtonContent}>
                                    <Upload className="h-4 w-4" />
                                    <span>Upload Files ({files.length}/5)</span>
                                </div>
                            </Button>
                        </div>

                        {files.length > 0 && (
                            <div className={styles.fileList}>
                                {files.map((file, index) => (
                                    <div key={index} className={styles.fileItem}>
                                        <span className={styles.fileName}>{file.name}</span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeFile(index)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <p className={styles.supportedFormat}>
                            Supported: Images (JPG, PNG, GIF) and PDF files
                        </p>
                    </div>

                    <Button type="submit" className={styles.submitButton} disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            "Submit Ticket"
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

export default TicketForm;

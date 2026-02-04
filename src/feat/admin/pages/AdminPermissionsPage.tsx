import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '@/infra/api/apiClient';
import { usePermission } from '@/core/hooks/usePermission';
import { Loader2, ShieldAlert, Save } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/shared/ui/card';
import { useToast } from '@/shared/ui/use-toast';
import { Separator } from '@/shared/ui/separator';

interface AdminPermissions {
    canApproveProducts: boolean;
    canEditAnyProduct: boolean;
    canDeleteAnyProduct: boolean;
    canManageCategories: boolean;
    canManageUsers: boolean;
    canSuspendUsers: boolean;
    canVerifyDealers: boolean;
    canChangeUserRoles: boolean;
    canViewAllOrders: boolean;
    canCancelAnyOrder: boolean;
    canIssueRefunds: boolean;
    canApprovePayouts: boolean;
    canViewFinancials: boolean;
    canModifyCommission: boolean;
    canAccessAuditLogs: boolean;
    canManageAdmins: boolean;
    canChangeSettings: boolean;
}

const DEFAULT_PERMISSIONS: AdminPermissions = {
    canApproveProducts: false,
    canEditAnyProduct: false,
    canDeleteAnyProduct: false,
    canManageCategories: false,
    canManageUsers: false,
    canSuspendUsers: false,
    canVerifyDealers: false,
    canChangeUserRoles: false,
    canViewAllOrders: false,
    canCancelAnyOrder: false,
    canIssueRefunds: false,
    canApprovePayouts: false,
    canViewFinancials: false,
    canModifyCommission: false,
    canAccessAuditLogs: false,
    canManageAdmins: false,
    canChangeSettings: false,
};

export default function AdminPermissionsPage() {
    const { adminId } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { can } = usePermission();

    const [permissions, setPermissions] = useState<AdminPermissions>(DEFAULT_PERMISSIONS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [adminName, setAdminName] = useState('');

    useEffect(() => {
        if (!can('MANAGE_ADMINS')) {
            // Technically handled by route, but double check
            toast({ title: "Access Denied", variant: "destructive" });
            navigate('/admin/dashboard');
            return;
        }

        const fetchPermissions = async () => {
            if (!adminId) return;
            try {
                setLoading(true);
                // Also fetch user details to show name
                const userRes = await apiClient.get(`/users/${adminId}`);
                setAdminName(userRes.data.user.name);

                const permRes = await apiClient.get(`/admin/permissions/${adminId}`);
                if (permRes.data.data) {
                    // Merge with default to ensure all keys exist
                    setPermissions({ ...DEFAULT_PERMISSIONS, ...permRes.data.data });
                }
            } catch (error) {
                console.error("Failed to fetch permissions:", error);
                toast({ title: "Error fetching permissions", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };

        fetchPermissions();
    }, [adminId, can, navigate, toast]);


    const handleToggle = (key: keyof AdminPermissions) => {
        setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = async () => {
        if (!adminId) return;
        try {
            setSaving(true);
            await apiClient.post(`/admin/permissions/${adminId}`, permissions);
            toast({ title: "Permissions Updated", description: `Permissions for ${adminName} have been saved.` });
        } catch (error) {
            console.error("Failed to save permissions:", error);
            toast({ title: "Save Failed", description: "Could not update permissions.", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

    const sections = [
        {
            title: "Product Management",
            items: [
                { key: 'canApproveProducts', label: 'Approve/Reject Products' },
                { key: 'canEditAnyProduct', label: 'Edit Any Product' },
                { key: 'canDeleteAnyProduct', label: 'Delete Any Product' },
                { key: 'canManageCategories', label: 'Manage Categories' },
            ]
        },
        {
            title: "User & Dealer Management",
            items: [
                { key: 'canManageUsers', label: 'View/Manage Users' },
                { key: 'canSuspendUsers', label: 'Suspend/Ban Users' },
                { key: 'canVerifyDealers', label: 'Verify Dealers' },
                { key: 'canChangeUserRoles', label: 'Change User Roles' },
            ]
        },
        {
            title: "Order & Finance",
            items: [
                { key: 'canViewAllOrders', label: 'View All Orders' },
                { key: 'canCancelAnyOrder', label: 'Cancel Any Order' },
                { key: 'canIssueRefunds', label: 'Issue Refunds' },
                { key: 'canApprovePayouts', label: 'Approve Payouts' },
                { key: 'canViewFinancials', label: 'View Financial Reports' },
                { key: 'canModifyCommission', label: 'Modify Commission Rates' },
            ]
        },
        {
            title: "System & Security",
            items: [
                { key: 'canAccessAuditLogs', label: 'View Audit Logs' },
                { key: 'canManageAdmins', label: 'Manage Admin Permissions' },
                { key: 'canChangeSettings', label: 'Change Site Settings' },
            ]
        }
    ];

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Admin Permissions</h1>
                    <p className="text-muted-foreground">Managing capabilities for: <span className="font-semibold text-foreground">{adminName} ({adminId})</span></p>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                </Button>
            </div>

            <div className="grid gap-6">
                {sections.map((section, idx) => (
                    <Card key={idx}>
                        <CardHeader>
                            <CardTitle>{section.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {section.items.map(item => (
                                <div key={item.key} className="flex items-start space-x-3 p-2 rounded hover:bg-muted/50">
                                    <Checkbox
                                        id={item.key}
                                        checked={permissions[item.key as keyof AdminPermissions]}
                                        onCheckedChange={() => handleToggle(item.key as keyof AdminPermissions)}
                                    />
                                    <div className="grid gap-1.5 leading-none">
                                        <label
                                            htmlFor={item.key}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                        >
                                            {item.label}
                                        </label>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

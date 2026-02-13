import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/infra/api/apiClient';
import { usePermission } from '@/core/hooks/usePermission';
import {
    Users as UsersIcon,
    Shield,
    ShieldAlert,
    Settings,
    Loader2,
    Search,
    ArrowLeft,
    ChevronRight,
    UserCheck,
    Mail
} from 'lucide-react';
import { Button } from '@/ui/Button';
import { Input } from '@/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/ui/Card';
import { Badge } from '@/ui/Badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/Avatar';
import { useToast } from '@/shared/hook/use-toast';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/ui/Table';

interface AdminUser {
    id: string;
    email: string;
    name: string | null;
    role: string;
    status: string;
    createdAt: string;
    adminPermission?: any;
}

export default function AdminStaffList() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { can } = usePermission();

    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!can('MANAGE_ADMINS')) {
            toast({ title: "Access Denied", variant: "destructive" });
            navigate('/admin');
            return;
        }

        const fetchAdmins = async () => {
            try {
                setLoading(true);
                const response = await apiClient.get('/admin/admins');
                if (response.data.success) {
                    setAdmins(response.data.data);
                }
            } catch (error) {
                console.error("Failed to fetch admins:", error);
                toast({ title: "Error fetching staff", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };

        fetchAdmins();
    }, [can, navigate, toast]);

    const filteredAdmins = admins.filter(admin =>
        admin.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => navigate('/admin')} className="-ml-2 h-8 px-2">
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Dashboard
                        </Button>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>
                    <p className="text-muted-foreground italic">Managing access levels for platform administrators and staff</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search staff..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-10 rounded-xl"
                        />
                    </div>
                </div>
            </div>

            <div className="grid gap-6">
                <Card className="border-border/60 shadow-sm overflow-hidden">
                    <CardHeader className="bg-muted/30">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-primary" />
                                <CardTitle className="text-lg">Platform Administrators</CardTitle>
                            </div>
                            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                                {admins.length} Staff Members
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-border/40">
                                    <TableHead className="w-[300px] pl-6">Staff Member</TableHead>
                                    <TableHead>System Role</TableHead>
                                    <TableHead>Clearance Status</TableHead>
                                    <TableHead className="text-right pr-6">Management</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredAdmins.map((admin) => (
                                    <TableRow key={admin.id} className="group hover:bg-muted/20 border-border/20">
                                        <TableCell className="pl-6">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10 border border-border/40">
                                                    <AvatarFallback className="bg-primary/5 text-primary font-bold text-xs uppercase">
                                                        {admin.name?.charAt(0) || admin.email.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="font-semibold text-sm truncate">{admin.name || 'Anonymous Admin'}</span>
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                        <Mail className="h-3 w-3" />
                                                        <span className="truncate">{admin.email}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={admin.role === 'SUPER_ADMIN' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-emerald-500/10 text-emerald-600'}>
                                                {admin.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Staff Admin'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className={`h-2 w-2 rounded-full ${admin.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                                <span className="text-xs font-medium capitalize">{admin.status}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 rounded-lg border-border/60 hover:bg-primary hover:text-white hover:border-primary transition-all gap-1.5"
                                                onClick={() => navigate(`/admin/permissions/${admin.id}`)}
                                                disabled={admin.role === 'SUPER_ADMIN'}
                                            >
                                                <Settings className="h-3.5 w-3.5" />
                                                Manage Permissions
                                                <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredAdmins.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-32 text-center text-muted-foreground italic">
                                            No staff members found matching your search.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 gap-6">
                    <Card className="border-amber-500/20 bg-amber-500/5">
                        <CardHeader>
                            <CardTitle className="text-sm flex items-center gap-2 text-amber-700">
                                <ShieldAlert className="h-4 w-4" />
                                Identity Governance Notice
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-amber-600/80 leading-relaxed font-medium">
                                Super Admin accounts have unrestricted clearance across the entire platform.
                                Their permissions cannot be modified. For standard Staff Admins, ensure only
                                necessary permissions are granted following the Principle of Least Privilege.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-primary/20 bg-primary/5">
                        <CardHeader>
                            <CardTitle className="text-sm flex items-center gap-2 text-primary">
                                <UserCheck className="h-4 w-4" />
                                Audit Tracking
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-primary/70 leading-relaxed font-medium">
                                All permission changes are tracked in the system audit logs.
                                This includes who performed the change, the target admin, and
                                the timestamp of the operation.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

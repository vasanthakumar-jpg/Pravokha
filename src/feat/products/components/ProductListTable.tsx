import { useNavigate } from "react-router-dom";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/ui/Table";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/ui/DropdownMenu";
import { MoreVertical, Eye, Edit, XCircle, CheckCircle2, Trash2, Shield } from "lucide-react";
import { ProductImage } from "./ProductImage";
import { ProductDomain } from "../domain/types";

interface ProductListTableProps {
    products: ProductDomain[];
    onTogglePublish: (id: string, currentStatus: boolean) => void;
    onDelete: (id: string) => void;
    basePath: string; // e.g., "/admin/products" or "/seller/products"
}

export function ProductListTable({ products, onTogglePublish, onDelete, basePath }: ProductListTableProps) {
    const navigate = useNavigate();

    const getStockStatus = (stock: number = 0) => {
        if (stock === 0) return { label: "Out of Stock", color: "bg-red-500 text-white" };
        if (stock < 10) return { label: "Low Stock", color: "bg-orange-500 text-white" };
        return { label: "In Stock", color: "bg-green-500 text-white" };
    };

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Image</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead className="hidden md:table-cell">Category</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead className="hidden sm:table-cell">Stock</TableHead>
                        <TableHead className="hidden lg:table-cell">Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {products.map((product) => {
                        const stockStatus = getStockStatus(product.stock_quantity);
                        return (
                            <TableRow key={product.id}>
                                <TableCell>
                                    <ProductImage productId={product.id} title={product.title} src={product.main_image} />
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{product.title}</span>
                                        <div className="flex gap-1">
                                            {product.is_featured && <Badge className="bg-teal-600 text-white border-0 text-[10px] px-1.5 py-0 h-4">F</Badge>}
                                            {product.is_new && <Badge className="bg-yellow-400 text-yellow-900 border-0 text-[10px] px-1.5 py-0 h-4">N</Badge>}
                                            {!product.published && <Badge className="bg-orange-500 text-white border-0 text-[10px] px-1.5 py-0 h-4">D</Badge>}
                                            {product.is_verified && <Shield className="h-4 w-4 text-blue-600" />}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                    <Badge variant="outline" className="capitalize">
                                        {typeof product.category === 'string' ? product.category?.replace(/-/g, " ") : product.category?.name || product.category?.slug?.replace(/-/g, " ") || 'N/A'}
                                    </Badge>
                                </TableCell>
                                <TableCell>₹{product.price.toLocaleString()}</TableCell>
                                <TableCell className="hidden sm:table-cell">
                                    <Badge className={stockStatus.color}>{stockStatus.label}</Badge>
                                </TableCell>
                                <TableCell className="hidden lg:table-cell">
                                    <Badge variant={product.published ? "default" : "secondary"}>
                                        {product.published ? "Published" : "Draft"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => navigate(`/product/${product.slug}`)}>
                                                <Eye className="h-4 w-4 mr-2" /> View Live
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => navigate(`${basePath}/edit/${product.id}`)}>
                                                <Edit className="h-4 w-4 mr-2" /> Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onTogglePublish(product.id, product.published)}>
                                                {product.published ? <XCircle className="h-4 w-4 mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                                                {product.published ? "Unpublish" : "Publish"}
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-destructive" onClick={() => onDelete(product.id)}>
                                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}

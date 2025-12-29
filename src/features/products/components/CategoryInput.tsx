import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Plus, Trash2, Edit2, Loader2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/Command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/Popover";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/AlertDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/Badge";

interface Category {
    id: string;
    name: string;
    slug: string;
}

interface CategoryInputProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
    placeholder?: string;
    allowManagement?: boolean; // New prop to control permissions
}

export function CategoryInput({
    value,
    onChange,
    className,
    placeholder = "Select category...",
    allowManagement = false // Default to false for security
}: CategoryInputProps) {
    const [open, setOpen] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const { toast } = useToast();

    // Delete confirm state
    const [deleteId, setDeleteId] = useState<string | null>(null);
    // Edit state
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [editName, setEditName] = useState("");

    // Fetch Cart (Dynamic)
    const fetchCategories = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase.from('categories').select('*').order('name');
            if (error) throw error;
            setCategories(data || []);
        } catch (err) {
            console.error('Failed to fetch categories', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleCreate = async () => {
        if (!allowManagement) return; // Guard
        if (!searchValue.trim()) return;
        const name = searchValue.trim();
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        try {
            const { data, error } = await supabase.from('categories').insert({ name, slug }).select().single();
            if (error) {
                if (error.code === '23505') { // Unique violation
                    toast({ title: "Category exists", description: "This category already exists.", variant: "destructive" });
                } else {
                    throw error;
                }
                return;
            }

            setCategories(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
            onChange(data.slug);
            setOpen(false);
            setSearchValue("");
            toast({ title: "Category created", description: `"${name}" added successfully.` });
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    };

    const handleEdit = async () => {
        if (!allowManagement) return; // Guard
        if (!editingCategory || !editName.trim()) return;
        const slug = editName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        try {
            const { error } = await supabase.from('categories').update({ name: editName.trim(), slug }).eq('id', editingCategory.id);
            if (error) throw error;

            setCategories(prev => prev.map(c => c.id === editingCategory.id ? { ...c, name: editName.trim(), slug } : c).sort((a, b) => a.name.localeCompare(b.name)));

            // If the edited category was selected, update the selection
            if (value === editingCategory.slug) {
                onChange(slug);
            }

            setEditingCategory(null);
            setEditName("");
            toast({ title: "Category updated", description: "Category renamed successfully." });
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    };

    const handleDelete = async () => {
        if (!allowManagement) return; // Guard
        if (!deleteId) return;
        try {
            const { error } = await supabase.from('categories').delete().eq('id', deleteId);
            if (error) throw error;

            setCategories(prev => prev.filter(c => c.id !== deleteId));
            if (value === categories.find(c => c.id === deleteId)?.slug) {
                onChange(""); // Clear selection if deleted
            }
            toast({ title: "Category deleted", description: "Category removed successfully." });
        } catch (err: any) {
            toast({ title: "Error", description: "This category might be in use.", variant: "destructive" });
        } finally {
            setDeleteId(null);
        }
    };

    const selectedCategory = categories.find((c) => c.slug === value);

    return (
        <div className={cn("relative", className)}>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between h-12 text-base font-normal"
                    >
                        {value ? (
                            <span className="font-medium text-foreground">{categories.find((c) => c.slug === value)?.name || value}</span>
                        ) : (
                            <span className="text-muted-foreground">{placeholder}</span>
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                    <Command>
                        <CommandInput
                            placeholder={allowManagement ? "Search or create..." : "Search categories..."}
                            value={searchValue}
                            onValueChange={setSearchValue}
                            onKeyDown={(e) => {
                                if (allowManagement && e.key === 'Enter' && searchValue && !categories.some(c => c.name.toLowerCase() === searchValue.toLowerCase())) {
                                    e.preventDefault();
                                    handleCreate();
                                }
                            }}
                        />
                        <CommandList>
                            <CommandEmpty className="py-2 px-2 text-sm text-center">
                                {searchValue && allowManagement ? (
                                    <div className="flex flex-col gap-2 p-1">
                                        <span className="text-muted-foreground">No category found.</span>
                                        <Button size="sm" variant="secondary" className="w-full" onClick={handleCreate}>
                                            <Plus className="mr-2 h-3 w-3" /> Create "{searchValue}"
                                        </Button>
                                    </div>
                                ) : (
                                    <span className="text-muted-foreground">No category found.</span>
                                )}
                            </CommandEmpty>
                            <CommandGroup heading="Available Categories" className="max-h-[200px] overflow-y-auto">
                                {categories.map((category) => (
                                    <CommandItem
                                        key={category.id}
                                        value={category.name}
                                        onSelect={() => {
                                            onChange(category.slug === value ? "" : category.slug);
                                            setOpen(false);
                                        }}
                                        className="flex items-center justify-between group cursor-pointer"
                                    >
                                        <div className="flex items-center">
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    value === category.slug ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {category.name}
                                        </div>
                                        {allowManagement && (
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {/* Edit Action */}
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-6 w-6 hover:bg-blue-50 hover:text-blue-600"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingCategory(category);
                                                        setEditName(category.name);
                                                    }}
                                                >
                                                    <Edit2 className="h-3 w-3" />
                                                </Button>
                                                {/* Delete Action */}
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDeleteId(category.id);
                                                    }}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        )}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                        {allowManagement && (
                            <div className="border-t p-2 bg-muted/30 text-[10px] text-center text-muted-foreground">
                                Type and press Enter to add new.
                            </div>
                        )}
                    </Command>
                </PopoverContent>
            </Popover>

            {/* Edit Dialog */}
            <AlertDialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Edit Category</AlertDialogTitle>
                        <AlertDialogDescription>
                            Rename this category. This will update it for all products using it.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-2">
                        <input
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Category Name"
                            autoFocus
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleEdit}>Update</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the category. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}


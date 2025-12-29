import { useState, useRef, useEffect, useCallback } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { debounce } from "@/utils/debounce";
import { products } from "@/data/products";
import styles from "./SearchBar.module.css";
import { cn } from "@/lib/utils";

interface SearchBarProps {
    placeholder?: string;
    onSearch?: (query: string) => void;
    className?: string;
    iconOnly?: boolean;
}

export function SearchBar({
    placeholder = "Search...",
    onSearch,
    className = "",
    iconOnly = false,
}: SearchBarProps) {
    const [isOpen, setIsOpen] = useState(!iconOnly);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<typeof products>([]);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const searchRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const debouncedSearch = useCallback(
        debounce((query: string) => {
            if (query.trim()) {
                const filtered = products
                    .filter(
                        (p) =>
                            p.title.toLowerCase().includes(query.toLowerCase()) ||
                            p.description.toLowerCase().includes(query.toLowerCase()) ||
                            p.category.toLowerCase().includes(query.toLowerCase())
                    )
                    .slice(0, 5);
                setSearchResults(filtered);
            } else {
                setSearchResults([]);
            }
        }, 300),
        []
    );

    useEffect(() => {
        debouncedSearch(searchQuery);
    }, [searchQuery, debouncedSearch]);

    const handleSearchInput = (value: string) => {
        setSearchQuery(value);
        debouncedSearch(value);
    };

    const handleSearchSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (searchQuery.trim()) {
            if (onSearch) {
                onSearch(searchQuery);
            } else {
                navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
            }
            setSearchQuery("");
            setSearchResults([]);
            if (iconOnly) setIsOpen(false);
        }
    };

    const handleProductClick = (productId: string) => {
        navigate(`/product/${productId}`);
        setSearchQuery("");
        setSearchResults([]);
        if (iconOnly) setIsOpen(false);
    };

    const toggleSearch = () => {
        const newState = !isOpen;
        setIsOpen(newState);
        if (newState) {
            setTimeout(() => searchInputRef.current?.focus(), 100);
        } else {
            setSearchQuery("");
            setSearchResults([]);
        }
    };

    // Close search on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                if (iconOnly && isOpen) {
                    setIsOpen(false);
                    setSearchQuery("");
                    setSearchResults([]);
                }
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen, iconOnly]);

    if (iconOnly && !isOpen) {
        return (
            <Button variant="ghost" size="icon" onClick={toggleSearch} className={styles.iconButton}>
                <Search className={styles.iconButton} />
            </Button>
        );
    }

    return (
        <div className={cn(styles.container, className)} ref={searchRef}>
            <form onSubmit={handleSearchSubmit} className={styles.form}>
                <Search className={styles.searchIcon} />
                <Input
                    ref={searchInputRef}
                    type="text"
                    placeholder={placeholder}
                    value={searchQuery}
                    onChange={(e) => handleSearchInput(e.target.value)}
                    className={styles.input}
                />
                {searchQuery && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={styles.clearButton}
                        onClick={() => {
                            setSearchQuery("");
                            setSearchResults([]);
                        }}
                    >
                        <X className={styles.iconButton} />
                    </Button>
                )}
                {iconOnly && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={styles.closeButton}
                        onClick={toggleSearch}
                    >
                        <X className={styles.iconButton} />
                    </Button>
                )}
            </form>

            <AnimatePresence>
                {searchResults.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className={styles.resultsContainer}
                    >
                        <ScrollArea className={styles.resultsScrollArea}>
                            {searchResults.map((product) => (
                                <button
                                    key={product.id}
                                    onClick={() => handleProductClick(product.id)}
                                    className={styles.resultItem}
                                >
                                    <img
                                        src={product.images?.[0]}
                                        alt={product.title}
                                        className={styles.resultImage}
                                    />
                                    <div className={styles.resultInfo}>
                                        <p className={styles.resultTitle}>{product.title}</p>
                                        <p className={styles.resultPrice}>
                                            ₹{product.discountPrice || product.price}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </ScrollArea>
                        <button
                            onClick={() => handleSearchSubmit()}
                            className={styles.viewAllButton}
                        >
                            View all results
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}


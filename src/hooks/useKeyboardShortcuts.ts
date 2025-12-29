import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

interface KeyboardShortcut {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    action: () => void;
    description: string;
}

export function useKeyboardShortcuts() {
    const navigate = useNavigate();

    const shortcuts: KeyboardShortcut[] = [
        {
            key: "h",
            ctrl: true,
            description: "Go to Home",
            action: () => navigate("/"),
        },
        {
            key: "p",
            ctrl: true,
            description: "Go to Products",
            action: () => navigate("/products"),
        },
        {
            key: "c",
            ctrl: true,
            shift: true,
            description: "Go to Cart",
            action: () => navigate("/cart"),
        },
        {
            key: "w",
            ctrl: true,
            shift: true,
            description: "Go to Wishlist",
            action: () => navigate("/wishlist"),
        },
        {
            key: "/",
            ctrl: true,
            description: "Show Keyboard Shortcuts",
            action: () => {
                toast({
                    title: "Keyboard Shortcuts",
                    description: "Ctrl+H: Home | Ctrl+P: Products | Ctrl+Shift+C: Cart | Ctrl+Shift+W: Wishlist",
                    duration: 5000,
                });
            },
        },
    ];

    const handleKeyPress = useCallback(
        (event: KeyboardEvent) => {
            // Don't trigger shortcuts when typing in inputs
            if (
                event.target instanceof HTMLInputElement ||
                event.target instanceof HTMLTextAreaElement
            ) {
                return;
            }

            const shortcut = shortcuts.find(
                (s) =>
                    s.key.toLowerCase() === event.key.toLowerCase() &&
                    !!s.ctrl === event.ctrlKey &&
                    !!s.shift === event.shiftKey &&
                    !!s.alt === event.altKey
            );

            if (shortcut) {
                event.preventDefault();
                shortcut.action();
            }
        },
        [navigate]
    );

    useEffect(() => {
        window.addEventListener("keydown", handleKeyPress);
        return () => window.removeEventListener("keydown", handleKeyPress);
    }, [handleKeyPress]);

    return shortcuts;
}

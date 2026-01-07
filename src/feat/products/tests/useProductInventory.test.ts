import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useProductInventory } from "../hooks/useProductInventory";
import { supabase } from "@/infra/api/supabase";

// Mock Supabase
vi.mock("@/infra/api/supabase", () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                is: vi.fn(() => ({
                    order: vi.fn(() => Promise.resolve({ data: [], error: null })),
                    eq: vi.fn(() => ({
                        is: vi.fn(() => ({
                            order: vi.fn(() => Promise.resolve({ data: [], error: null }))
                        }))
                    }))
                }))
            }))
        }))
    }
}));

describe("useProductInventory", () => {
    it("should initialize with default values", () => {
        const { result } = renderHook(() => useProductInventory({ isAdmin: true }));
        expect(result.current.loading).toBe(true);
        expect(result.current.products).toEqual([]);
        expect(result.current.searchQuery).toBe("");
    });

    it("should fetch products on mount", async () => {
        const { result } = renderHook(() => useProductInventory({ isAdmin: true }));
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(supabase.from).toHaveBeenCalledWith("products");
    });
});

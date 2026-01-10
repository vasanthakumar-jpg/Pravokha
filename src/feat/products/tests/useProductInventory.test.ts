import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useProductInventory } from "../hooks/useProductInventory";


vi.mock("@/infra/api/apiClient", () => ({
    apiClient: {
        get: vi.fn(() => Promise.resolve({ data: { success: true, data: [] } }))
    }
}));

import { apiClient } from "@/infra/api/apiClient";

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
        expect(apiClient.get).toHaveBeenCalledWith("/products");
    });
});

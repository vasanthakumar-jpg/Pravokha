import { useEffect, useRef } from "react";
import { apiClient } from "@/infra/api/apiClient";
import { toast } from "@/shared/hook/use-toast";

export function useOrderNotifications(userId: string | undefined) {
  const lastStatuses = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!userId) return;

    const checkOrderUpdates = async () => {
      try {
        const response = await apiClient.get('/orders');
        const orders = response.data.data;

        // Safety check: ensure orders is an array before calling forEach
        if (!Array.isArray(orders)) {
          console.warn('[useOrderNotifications] Orders response is not an array:', orders);
          return;
        }

        orders.forEach((order: any) => {
          const prevStatus = lastStatuses.current[order.id];
          if (prevStatus && prevStatus !== order.status) {
            toast({
              title: "Order Status Updated",
              description: `Order #${order.orderNumber} is now ${order.status}`,
              duration: 5000,
            });
          }
          lastStatuses.current[order.id] = order.status;
        });
      } catch (error) {
        console.error("Error polling order updates:", error);
      }
    };

    // Initial check
    checkOrderUpdates();

    // Poll every 60 seconds
    const interval = setInterval(checkOrderUpdates, 60000);

    return () => clearInterval(interval);
  }, [userId]);
}

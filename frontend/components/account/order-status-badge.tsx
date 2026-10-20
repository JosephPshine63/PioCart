import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/lib/api/types";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";

const VARIANTS: Record<OrderStatus, "default" | "secondary" | "outline" | "destructive"> = {
  PENDING: "outline",
  PROCESSING: "secondary",
  SHIPPED: "default",
  DELIVERED: "outline",
  CANCELLED: "destructive",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge variant={VARIANTS[status]}>{ORDER_STATUS_LABELS[status]}</Badge>;
}

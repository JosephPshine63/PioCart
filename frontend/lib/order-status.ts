import type { OrderStatus } from "@/lib/api/types";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "In attesa di pagamento",
  PROCESSING: "In preparazione",
  SHIPPED: "Spedito",
  DELIVERED: "Consegnato",
  CANCELLED: "Annullato",
};

const priceFormatter = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });

export function formatPrice(amount: number): string {
  return priceFormatter.format(amount);
}

/** Same-origin URL of a product image, served by app/api/images/[id]. */
export function imageSrc(imageId: number): string {
  return `/api/images/${imageId}`;
}

/** Formats a backend LocalDate (yyyy-MM-dd) as e.g. "20 ottobre 2026". */
export function formatDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("it-IT", { dateStyle: "long" });
}

/** Formats a backend LocalDateTime as e.g. "20 ottobre 2026, 10:12". */
export function formatDateTime(isoDateTime: string): string {
  return new Date(isoDateTime).toLocaleString("it-IT", { dateStyle: "long", timeStyle: "short" });
}

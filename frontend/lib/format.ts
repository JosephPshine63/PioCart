const priceFormatter = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });

export function formatPrice(amount: number): string {
  return priceFormatter.format(amount);
}

/** Same-origin URL of a product image, served by app/api/images/[id]. */
export function imageSrc(imageId: number): string {
  return `/api/images/${imageId}`;
}

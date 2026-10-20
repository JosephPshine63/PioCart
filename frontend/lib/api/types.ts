// Mirrors the backend DTOs (dev.pioruocco.piocart.dto / response). BigDecimal fields arrive as JSON numbers.

export type Role = "USER" | "ADMIN";

export type OrderStatus = "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export interface ApiResponse<T> {
  message: string;
  data: T;
}

export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface Category {
  id: number;
  name: string;
}

export interface Image {
  id: number;
  fileName: string;
  downloadUrl: string;
}

export interface Product {
  id: number;
  name: string;
  brand: string;
  price: number;
  inventory: number;
  description: string;
  category: Category;
  images: Image[];
}

export interface CartItem {
  itemId: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product: Product;
}

export interface Cart {
  cartId: number;
  items: CartItem[];
  totalAmount: number;
}

export interface OrderItem {
  productId: number;
  productName: string;
  /** First image of the product, if it has any. */
  imageId: number | null;
  quantity: number;
  price: number;
}

export interface Order {
  id: number;
  userId: number;
  customerName: string;
  customerEmail: string;
  /** ISO date (yyyy-MM-dd) */
  orderDate: string;
  /** ISO local date-time of the verified payment; null while the checkout is unpaid. */
  paidAt: string | null;
  totalAmount: number;
  status: OrderStatus;
  items: OrderItem[];
}

export interface CheckoutResponse {
  orderId: number;
  /** Hosted Stripe Checkout page. */
  paymentUrl: string;
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
}

export interface AuthResponse {
  token: string;
  user: User;
}

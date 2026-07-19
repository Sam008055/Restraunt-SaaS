// Shared types for the customer ordering flow
export interface CartItem {
  id: string;        // unique cart entry id
  menuItemId: string;
  name: string;
  price: number;     // resolved price (base or variant)
  variantName?: string;
  quantity: number;
  isVeg: boolean;
}

export interface Order {
  id: string;
  restaurantId: string;
  tableId: string;
  customerSessionId: string;
  items: CartItem[];
  subtotal: number;
  taxTotal: number;
  total: number;
  order_status: "received" | "preparing" | "served" | "cancelled";
  payment_status: "pending" | "paid" | "refunded" | "failed";
  paymentMode: "online-prepay" | "pay-at-table";
  createdAt: string;
}

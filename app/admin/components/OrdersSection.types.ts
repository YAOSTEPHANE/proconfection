export type AdminOrder = {
  orderId: string;
  customerName: string;
  customerEmail: string;
  total: number;
  status: string;
  createdAt: string;
  lines?: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
};

export type AdminOrderDetails = AdminOrder & {
  lines: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
};

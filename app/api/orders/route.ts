import { NextResponse } from "next/server";
import { hasValidAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { databaseErrorHeaders, formatMongoError } from "@/lib/mongodb-errors";
import type { Filter } from "mongodb";

type OrderLine = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

type OrderRecord = {
  orderId: string;
  customerName: string;
  customerEmail: string;
  lines: OrderLine[];
  total: number;
  status: string;
  createdAt: Date;
  paidAt?: Date;
};
const ORDER_STATUS_VALUES = ["pending_payment", "pending_confirmation", "paid", "canceled"] as const;

export async function GET(request: Request) {
  try {
    const isAuthorized = await hasValidAdminSession();
    if (!isAuthorized) {
      return NextResponse.json({ error: "Acces non autorise." }, { status: 401 });
    }

    const db = await getDb();
    const requestUrl = new URL(request.url);
    const search = requestUrl.searchParams.get("search")?.trim();
    const status = requestUrl.searchParams.get("status")?.trim();
    const sortBy = requestUrl.searchParams.get("sortBy") === "total" ? "total" : "createdAt";
    const sortDir = requestUrl.searchParams.get("sortDir") === "asc" ? 1 : -1;
    const page = Math.max(1, Number(requestUrl.searchParams.get("page") ?? "1") || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, Number(requestUrl.searchParams.get("pageSize") ?? "10") || 10),
    );

    const filter: Filter<OrderRecord> = {};
    if (status && status !== "all" && !ORDER_STATUS_VALUES.includes(status as (typeof ORDER_STATUS_VALUES)[number])) {
      return NextResponse.json({ error: "Parametre status invalide." }, { status: 400 });
    }
    if (status && status !== "all") {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { orderId: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
        { customerEmail: { $regex: search, $options: "i" } },
      ];
    }

    const ordersCollection = db.collection<OrderRecord>("orders");
    const total = await ordersCollection.countDocuments(filter);
    const orders = await ordersCollection
      .find(filter, { projection: { _id: 0 } })
      .sort({ [sortBy]: sortDir })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .toArray();

    return NextResponse.json({
      items: orders,
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (error) {
    console.error("GET /api/orders:", error);
    return NextResponse.json(
      {
        items: [],
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 1,
        degraded: true,
        error: formatMongoError(error),
      },
      { status: 200, headers: databaseErrorHeaders(error) },
    );
  }
}

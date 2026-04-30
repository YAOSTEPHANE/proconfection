import { NextResponse } from "next/server";
import { hasValidAdminSession } from "@/lib/auth";
import {
  DEFAULT_SCHOOL_PRICING_COEFFICIENTS,
  type SchoolPricingCoefficients,
} from "@/lib/catalog";
import { getDb } from "@/lib/mongodb";

type PricingConfigDocument = {
  id: "school-pricing";
  coefficients: SchoolPricingCoefficients;
  updatedAt: string;
};

function normalizeCoefficient(value: unknown, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(1.5, Math.max(0.7, Math.round(value * 100) / 100));
}

function normalizeCoefficients(value: unknown): SchoolPricingCoefficients {
  const input = typeof value === "object" && value !== null ? value : {};
  const data = input as Partial<SchoolPricingCoefficients>;
  return {
    jacquesPrevert: normalizeCoefficient(
      data.jacquesPrevert,
      DEFAULT_SCHOOL_PRICING_COEFFICIENTS.jacquesPrevert,
    ),
    blaisePascal: normalizeCoefficient(
      data.blaisePascal,
      DEFAULT_SCHOOL_PRICING_COEFFICIENTS.blaisePascal,
    ),
    jeanMermoz: normalizeCoefficient(
      data.jeanMermoz,
      DEFAULT_SCHOOL_PRICING_COEFFICIENTS.jeanMermoz,
    ),
  };
}

export async function GET() {
  try {
    const db = await getDb();
    const doc = await db
      .collection<PricingConfigDocument>("app_settings")
      .findOne({ id: "school-pricing" }, { projection: { _id: 0 } });

    if (!doc) {
      return NextResponse.json({ coefficients: DEFAULT_SCHOOL_PRICING_COEFFICIENTS });
    }

    return NextResponse.json({ coefficients: normalizeCoefficients(doc.coefficients) });
  } catch {
    return NextResponse.json({ coefficients: DEFAULT_SCHOOL_PRICING_COEFFICIENTS });
  }
}

export async function PUT(request: Request) {
  try {
    const isAuthorized = await hasValidAdminSession();
    if (!isAuthorized) {
      return NextResponse.json({ error: "Acces non autorise." }, { status: 401 });
    }

    const body = (await request.json()) as {
      coefficients?: Partial<SchoolPricingCoefficients>;
    };

    const coefficients = normalizeCoefficients(body.coefficients);
    const document: PricingConfigDocument = {
      id: "school-pricing",
      coefficients,
      updatedAt: new Date().toISOString(),
    };

    const db = await getDb();
    await db
      .collection<PricingConfigDocument>("app_settings")
      .updateOne({ id: "school-pricing" }, { $set: document }, { upsert: true });

    return NextResponse.json({ coefficients });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sauvegarde impossible.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

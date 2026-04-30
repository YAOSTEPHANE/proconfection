import { NextResponse } from "next/server";
import { hasValidAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import type { UserRecord } from "@/lib/users";

type Params = { params: Promise<{ id: string }> };

function isUserStatus(value: string): value is "active" | "inactive" {
  return value === "active" || value === "inactive";
}

type UserInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  status: "active" | "inactive";
};

function validateUserInput(body: Partial<UserRecord>): UserInput | string {
  const firstName = body.firstName?.trim() ?? "";
  const lastName = body.lastName?.trim() ?? "";
  const email = body.email?.trim().toLowerCase() ?? "";
  const phone = body.phone?.trim() ?? "";
  const city = body.city?.trim() ?? "";
  const status = body.status ?? "active";

  if (firstName.length < 2) return "Prenom invalide.";
  if (lastName.length < 2) return "Nom invalide.";
  if (!email.includes("@") || email.length < 6) return "Email invalide.";
  if (phone.length < 8) return "Telephone invalide.";
  if (city.length < 2) return "Ville invalide.";
  if (!isUserStatus(status)) return "Statut invalide.";

  return { firstName, lastName, email, phone, city, status };
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const isAuthorized = await hasValidAdminSession();
    if (!isAuthorized) {
      return NextResponse.json({ error: "Acces non autorise." }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "ID manquant." }, { status: 400 });
    }

    const body = (await request.json()) as Partial<UserRecord>;
    const validated = validateUserInput(body);
    if (typeof validated === "string") {
      return NextResponse.json({ error: validated }, { status: 400 });
    }

    const db = await getDb();
    const emailConflict = await db
      .collection<UserRecord>("users")
      .findOne({ email: validated.email, id: { $ne: id } }, { projection: { _id: 0 } });
    if (emailConflict) {
      return NextResponse.json(
        { error: "Un utilisateur avec cet email existe deja." },
        { status: 409 },
      );
    }

    const result = await db
      .collection<UserRecord>("users")
      .updateOne({ id }, { $set: validated });
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
    }

    const updated = await db
      .collection<UserRecord>("users")
      .findOne({ id }, { projection: { _id: 0 } });

    return NextResponse.json(updated);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Connexion MongoDB impossible.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    const isAuthorized = await hasValidAdminSession();
    if (!isAuthorized) {
      return NextResponse.json({ error: "Acces non autorise." }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "ID manquant." }, { status: 400 });
    }

    const db = await getDb();
    const result = await db.collection<UserRecord>("users").deleteOne({ id });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Connexion MongoDB impossible.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

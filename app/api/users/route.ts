import { NextResponse } from "next/server";
import { hasValidAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { defaultUsers, type UserRecord } from "@/lib/users";

type UserInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  status: "active" | "inactive";
};

function isUserStatus(value: string): value is "active" | "inactive" {
  return value === "active" || value === "inactive";
}

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

export async function GET() {
  try {
    const isAuthorized = await hasValidAdminSession();
    if (!isAuthorized) {
      return NextResponse.json({ error: "Acces non autorise." }, { status: 401 });
    }

    const db = await getDb();
    const users = await db
      .collection<UserRecord>("users")
      .find({}, { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .toArray();

    if (users.length === 0) {
      await db.collection<UserRecord>("users").insertMany(defaultUsers);
      return NextResponse.json(defaultUsers);
    }

    return NextResponse.json(users);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Connexion MongoDB impossible.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const isAuthorized = await hasValidAdminSession();
    if (!isAuthorized) {
      return NextResponse.json({ error: "Acces non autorise." }, { status: 401 });
    }

    const body = (await request.json()) as Partial<UserRecord>;
    const validated = validateUserInput(body);
    if (typeof validated === "string") {
      return NextResponse.json({ error: validated }, { status: 400 });
    }

    const db = await getDb();
    const existing = await db
      .collection<UserRecord>("users")
      .findOne({ email: validated.email }, { projection: { _id: 0 } });

    if (existing) {
      return NextResponse.json(
        { error: "Un utilisateur avec cet email existe deja." },
        { status: 409 },
      );
    }

    const user: UserRecord = {
      id: `u-${crypto.randomUUID().slice(0, 8)}`,
      createdAt: new Date().toISOString(),
      ...validated,
    };

    await db.collection<UserRecord>("users").insertOne(user);
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Connexion MongoDB impossible.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

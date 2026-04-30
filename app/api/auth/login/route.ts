import { NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  createSignedSessionToken,
  isValidAdminCredentials,
} from "@/lib/auth";

type LoginBody = {
  email: string;
  password: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<LoginBody>;
    const email = body.email ?? "";
    const password = body.password ?? "";

    if (!isValidAdminCredentials(email, password)) {
      return NextResponse.json(
        { error: "Identifiants invalides." },
        { status: 401 },
      );
    }

    const token = createSignedSessionToken(email);
    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Requete de connexion invalide." },
      { status: 400 },
    );
  }
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Connexion impossible.");
        setLoading(false);
        return;
      }

      router.push("/admin");
    } catch {
      setError("Erreur reseau. Veuillez reessayer.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col items-center">
          <Image
            src="/logo-proconfection.png"
            alt="ProConfection Internationale"
            width={220}
            height={120}
            className="h-10 w-auto"
            priority
          />
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
            ProConfection
          </p>
          <h1 className="mt-4 text-center text-2xl font-bold text-slate-900">
            Se connecter
          </h1>
          <p className="mt-1 text-center text-sm text-slate-600">
            Connectez-vous pour acceder a l&apos;espace d&apos;administration.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@proconfection.com"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-slate-400"
              autoComplete="email"
              required
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Mot de passe
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Votre mot de passe"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-slate-400"
              autoComplete="current-password"
              required
            />
          </label>

          {error ? <p className="text-sm text-rose-700">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          <Link href="/" prefetch={false} className="text-indigo-700 hover:underline">
            Retour a la boutique
          </Link>
        </div>
      </div>
    </main>
  );
}

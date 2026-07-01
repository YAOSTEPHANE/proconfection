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
      setError("Erreur réseau. Veuillez réessayer.");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen">
      <section
        className="relative hidden w-[46%] overflow-hidden lg:flex lg:flex-col lg:justify-between"
        aria-hidden="true"
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 90% 70% at 20% 20%, rgba(184,149,108,0.22), transparent 55%), radial-gradient(ellipse 60% 50% at 80% 80%, rgba(196,92,122,0.1), transparent 50%), linear-gradient(160deg, #fffcf8 0%, #f5efe4 45%, #efe9df 100%)",
          }}
        />
        <div className="relative flex flex-1 flex-col justify-between p-12 xl:p-16">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-[rgba(184,149,108,0.25)]">
              <Image
                src="/logo-proconfection.png"
                alt=""
                width={40}
                height={40}
                className="h-8 w-auto"
                priority
              />
            </div>
            <span className="admin-badge admin-badge-gold">Administration</span>
          </div>

          <div className="max-w-md space-y-6">
            <h2 className="text-3xl font-semibold leading-tight tracking-tight text-stone-900 xl:text-4xl">
              Gérez votre boutique avec élégance.
            </h2>
            <p className="text-base leading-relaxed text-stone-600">
              Catalogue, commandes, utilisateurs et paramètres — tout votre univers ProConfection
              dans un espace pensé pour la performance.
            </p>
            <ul className="space-y-3 text-sm text-stone-600">
              {[
                "Tableau de bord en temps réel",
                "Gestion produits & catégories",
                "Suivi des commandes et clients",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#b8956c] text-white">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-stone-400">
            ProConfection Internationale — espace réservé aux administrateurs
          </p>
        </div>
        <div className="admin-gold-line relative" />
      </section>

      <section className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <div className="admin-card-elevated admin-animate-in w-full max-w-md overflow-hidden">
          <div className="relative border-b border-stone-100 bg-gradient-to-r from-[#fffcf8] via-white to-[#faf6ef] px-8 py-8 text-center">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-[#b8956c] to-transparent" />
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-[rgba(184,149,108,0.2)]">
              <Image
                src="/logo-proconfection.png"
                alt="ProConfection Internationale"
                width={56}
                height={56}
                className="h-10 w-auto"
                priority
              />
            </div>
            <span className="admin-badge admin-badge-gold">Espace sécurisé</span>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-stone-900">
              Connexion
            </h1>
            <p className="mt-2 text-sm text-stone-500">
              Accédez à votre tableau de bord d&apos;administration
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 px-8 py-8">
            <label className="block">
              <span className="admin-label">Adresse email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@proconfection.com"
                className="admin-input"
                autoComplete="email"
                required
              />
            </label>

            <label className="block">
              <span className="admin-label">Mot de passe</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Votre mot de passe"
                className="admin-input"
                autoComplete="current-password"
                required
              />
            </label>

            {error ? (
              <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-[#fdf2f5] px-4 py-3 text-sm text-rose-700">
                <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <span>{error}</span>
              </div>
            ) : null}

            <button type="submit" disabled={loading} className="admin-btn-primary w-full py-3">
              {loading ? (
                <>
                  <LoadingSpinner />
                  Connexion en cours…
                </>
              ) : (
                <>
                  <LockIcon />
                  Se connecter
                </>
              )}
            </button>
          </form>

          <div className="border-t border-stone-100 bg-[#fffcf8] px-8 py-5 text-center">
            <Link href="/" prefetch={false} className="admin-btn-secondary inline-flex text-sm">
              <StoreIcon />
              Retour à la boutique
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function LockIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}

function StoreIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75v-4.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v4.5c0 .414.336.75.75.75z" />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

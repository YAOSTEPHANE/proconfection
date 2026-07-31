"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type DashboardHeaderProps = {
  totalProducts: number;
  error: string | null;
  onLogout: () => void;
};

export default function DashboardHeader({ totalProducts, error, onLogout }: DashboardHeaderProps) {
  return (
    <header className="admin-card-elevated admin-animate-in overflow-hidden">
      <div className="relative px-6 py-5 md:px-8 md:py-6">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 70% 80% at 0% 0%, rgba(184,149,108,0.15), transparent 60%), radial-gradient(ellipse 50% 60% at 100% 100%, rgba(196,92,122,0.08), transparent 50%)",
          }}
        />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-[rgba(184,149,108,0.2)]">
              <Image
                src="/logo-proconfection.png"
                alt="ProConfection"
                width={48}
                height={48}
                className="h-9 w-auto"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="admin-badge admin-badge-gold">Administration</span>
                <span className="hidden text-[11px] text-stone-400 sm:inline">•</span>
                <span className="hidden text-[11px] font-medium text-stone-500 sm:inline">
                  Tableau de bord
                </span>
              </div>
              <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-stone-900 md:text-[1.75rem]">
                ProConfection Internationale
              </h1>
              <p className="mt-0.5 text-sm text-stone-500">
                <span className="font-medium text-[#9a7b4f]">{totalProducts}</span> produits actifs
                dans le catalogue
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/" prefetch={false} className="admin-btn-secondary text-sm">
              <StoreIcon />
              Boutique
            </Link>
            <button type="button" onClick={onLogout} className="admin-btn-primary text-sm">
              <LogoutIcon />
              Déconnexion
            </button>
          </div>
        </div>

        {error ? (
          <div className="relative mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-[#fdf2f5] px-4 py-3 text-sm text-rose-700">
            <AlertIcon />
            <span>{error}</span>
          </div>
        ) : null}
      </div>
      <div className="admin-gold-line" />
    </header>
  );
}

function StoreIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75v-4.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v4.5c0 .414.336.75.75.75z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
}

type StatCardProps = {
  label: string;
  value: string | number;
  accent?: "gold" | "emerald" | "amber" | "rose";
  icon?: ReactNode;
  trend?: string;
};

const accentStyles = {
  gold: {
    ring: "ring-[rgba(184,149,108,0.2)]",
    icon: "bg-[#f5efe4] text-[#9a7b4f]",
    value: "text-stone-900",
  },
  emerald: {
    ring: "ring-emerald-200/60",
    icon: "bg-emerald-50 text-emerald-600",
    value: "text-emerald-800",
  },
  amber: {
    ring: "ring-amber-200/60",
    icon: "bg-amber-50 text-amber-600",
    value: "text-amber-800",
  },
  rose: {
    ring: "ring-rose-200/60",
    icon: "bg-rose-50 text-rose-600",
    value: "text-rose-800",
  },
};

export function StatCard({ label, value, accent = "gold", icon, trend }: StatCardProps) {
  const styles = accentStyles[accent];
  return (
    <article
      className={`admin-card group relative overflow-hidden p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ring-1 ${styles.ring}`}
    >
      <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br from-[rgba(184,149,108,0.08)] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-stone-500">
            {label}
          </p>
          <p className={`mt-2 text-2xl font-semibold tracking-tight ${styles.value}`}>{value}</p>
          {trend ? <p className="mt-1 text-xs text-stone-400">{trend}</p> : null}
        </div>
        {icon ? (
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}>
            {icon}
          </div>
        ) : null}
      </div>
    </article>
  );
}

export function SectionPanel({
  title,
  subtitle,
  children,
  action,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`admin-card overflow-hidden ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 px-5 py-4 md:px-6">
        <div>
          <h2 className="admin-section-title">{title}</h2>
          {subtitle ? <p className="admin-section-subtitle mt-0.5">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      <div className="p-5 md:p-6">{children}</div>
    </section>
  );
}

export function PremiumModal({
  title,
  subtitle,
  onClose,
  children,
  size = "lg",
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  size?: "md" | "lg" | "xl";
}) {
  const [mounted, setMounted] = useState(false);
  const sizeClass =
    size === "xl" ? "max-w-5xl" : size === "md" ? "max-w-2xl" : "max-w-4xl";

  useEffect(() => {
    setMounted(true);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  if (!mounted) {
    return null;
  }

  return createPortal(
    <div className="admin-theme-scope">
      <div className="admin-modal-overlay fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div
          className={`admin-modal-panel admin-animate-in flex max-h-[90vh] w-full ${sizeClass} flex-col overflow-hidden`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="premium-modal-title"
        >
          <div className="relative shrink-0 border-b border-stone-100 bg-white px-6 py-4">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-[#b8956c] to-transparent" />
            <div className="flex items-center justify-between gap-4">
              <div>
                {subtitle ? (
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b8956c]">
                    {subtitle}
                  </p>
                ) : null}
                <h2 id="premium-modal-title" className="text-lg font-semibold tracking-tight text-stone-900">
                  {title}
                </h2>
              </div>
              <button type="button" onClick={onClose} className="admin-btn-ghost rounded-full px-3" aria-label="Fermer">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto bg-white">{children}</div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

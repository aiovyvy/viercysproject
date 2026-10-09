"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Navigation, Footer } from "@/app/experience";
import "./journey.css";
import { CURRENCY } from "@/lib/catalog";
export function Shell({
  title,
  eyebrow = "VIERCYS SANTORINI",
  children,
}: {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Navigation />
      <main id="main" className="inner-main journey-main">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="demo-banner">
          Fictional property · Persistent local demo · Sample {CURRENCY} prices
          · No real payments
        </p>
        {children}
      </main>
      <Footer />
    </>
  );
}
export async function api<T>(
  url: string,
  data?: unknown,
  method = "POST",
): Promise<T> {
  const response = await fetch(url, {
    method: data === undefined ? "GET" : method,
    headers:
      data === undefined ? undefined : { "Content-Type": "application/json" },
    body: data === undefined ? undefined : JSON.stringify(data),
    cache: "no-store",
  });
  const result = await response.json();
  if (!response.ok)
    throw new ApiError(
      result.error || "The request could not be completed.",
      result.code,
    );
  return result;
}
export class ApiError extends Error {
  constructor(
    message: string,
    public code?: string,
  ) {
    super(message);
  }
}
/** Lets every voucher banner re-check after the voucher is used or lost. */
export const VOUCHER_EVENT = "viercys-voucher-changed";
export function useData<T>(url: string, body?: unknown) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const [resolved, setResolved] = useState("");
  const encoded = body === undefined ? undefined : JSON.stringify(body);
  const key = url + "|" + encoded + "|" + version;
  useEffect(() => {
    let active = true;
    api<T>(url, encoded === undefined ? undefined : JSON.parse(encoded))
      .then((result) => {
        if (active) {
          setData(result);
          setError("");
          setLoading(false);
          setResolved(key);
        }
      })
      .catch((error) => {
        if (active) {
          setError(error.message);
          setLoading(false);
          setResolved(key);
        }
      });
    return () => {
      active = false;
    };
  }, [url, encoded, version, key]);
  return {
    data: resolved === key ? data : null,
    error: resolved === key ? error : "",
    loading: resolved !== key || loading,
    refresh: () => {
      setLoading(true);
      setVersion((value) => value + 1);
    },
  };
}
export function Feedback({
  error,
  loading,
}: {
  error?: string;
  loading?: boolean;
}) {
  return (
    <>
      {loading && <p role="status">Preparing your stay…</p>}
      {error && (
        <div className="notice" role="alert">
          <p>{error}</p>
        </div>
      )}
    </>
  );
}
export function GuestLinks({ reference }: { reference: string }) {
  return (
    <nav className="journey-links" aria-label="Your stay">
      <Link href={`/booking/${reference}`}>My Stay</Link>
      <Link href={`/itinerary/${reference}`}>Your Journey</Link>
      <Link href="/concierge">Concierge</Link>
      <Link href={`/booking/${reference}/receipt`}>Receipt</Link>
      <Link href={`/booking/${reference}/email-preview`}>Email preview</Link>
    </nav>
  );
}

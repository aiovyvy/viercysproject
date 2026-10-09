"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Navigation, Footer } from "@/app/experience";
import "./journey.css";
import "./booking-flow.css";
import { CURRENCY } from "@/lib/catalog";
/**
 * Layout for guest, room and staff pages. Matches the booking flow: one
 * heading, an optional back link, and a single quiet disclosure line in
 * place of the old dark "demo" banner.
 */
export function Shell({
  title,
  eyebrow,
  back,
  children,
}: {
  title: string;
  eyebrow?: string;
  back?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <>
      <Navigation />
      <main id="main" className="book-main journey-main">
        {back && (
          <div className="book-top">
            <Link className="book-back" href={back.href}>
              <span aria-hidden="true">←</span> {back.label}
            </Link>
          </div>
        )}
        {eyebrow && <p className="shell-eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {children}
        <p className="book-footnote">
          VIERCYS is a fictional hotel created for a classroom demonstration.
          Prices are simulated in {CURRENCY}; no real payment, travel or
          accommodation is booked.
        </p>
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
      result,
    );
  return result;
}
export class ApiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public data?: Record<string, unknown>,
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
      <Link href={`/booking/${reference}`}>Your booking</Link>
      <Link href={`/itinerary/${reference}`}>Plan your visit</Link>
      <Link href={`/booking/${reference}/receipt`}>Receipt</Link>
    </nav>
  );
}

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "./journey";
export function ClaimButton({ token }: { token: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function claim() {
    setBusy(true);
    setError("");
    try {
      await api("/api/invite/claim", { token });
      router.push("/book");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not claim this invitation.",
      );
      setBusy(false);
    }
  }
  return (
    <>
      <button
        type="button"
        className="book-button primary invite-claim"
        onClick={claim}
        disabled={busy}
      >
        {busy ? "Opening your booking…" : "Claim your stay"}
      </button>
      {error && (
        <p className="book-error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}

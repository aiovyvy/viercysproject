"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "./journey";

export function ClassInviteClaim({
  token,
  roster,
}: {
  token: string;
  roster: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      await api("/api/invite/class/register", {
        token,
        name: form.get("name"),
        identifier: form.get("identifier"),
        email: form.get("email"),
        credential: form.get("credential"),
      });
      router.push("/book");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Please try again.");
      setBusy(false);
    }
  }
  return (
    <form className="book-form class-registration" onSubmit={submit}>
      <div className="book-field">
        <label htmlFor="class-name">Full name</label>
        <input
          id="class-name"
          name="name"
          autoComplete="name"
          required
          minLength={2}
          maxLength={100}
        />
      </div>
      <div className="book-field">
        <label htmlFor="class-student">Student identifier</label>
        <input
          id="class-student"
          name="identifier"
          autoComplete="off"
          required
          minLength={2}
          maxLength={64}
          aria-describedby="class-privacy"
        />
      </div>
      {roster && (
        <div className="book-field">
          <label htmlFor="class-code">Private claim code</label>
          <input
            id="class-code"
            name="credential"
            type="password"
            autoComplete="off"
            required
            maxLength={100}
          />
          <p className="book-help">
            Use the code your host gave you individually. Keep it private.
          </p>
        </div>
      )}
      <div className="book-field">
        <label htmlFor="class-email">Email address (optional)</label>
        <input
          id="class-email"
          name="email"
          type="email"
          autoComplete="email"
          maxLength={254}
        />
      </div>
      <p className="invite-small" id="class-privacy">
        Your identifier is shared only with staff. It prevents repeat claims; it
        does not verify your identity. Email is optional. Save your booking
        reference and keep this browser’s confirmation for access without email.
      </p>
      <button className="book-button primary" disabled={busy}>
        {busy ? "Preparing your invitation…" : "Claim Your Stay"}
      </button>
      {error && (
        <p className="book-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

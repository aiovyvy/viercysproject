"use client";
import { useState } from "react";
import Link from "next/link";
import { Shell, useData, api, Feedback } from "./journey";
export default function Profile() {
  const result = useData<{
    profile: { email: string; name: string; phone: string };
  }>("/api/profile");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  return (
    <Shell
      title="Guest profile."
      back={{ href: "/my-stay", label: "My VIERCYS" }}
    >
      <Feedback error={result.error || error} loading={result.loading} />
      {result.error && (
        <Link className="j-button" href="/lookup">
          Verify your email to continue
        </Link>
      )}
      {result.data && (
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            setError("");
            try {
              await api(
                "/api/profile",
                Object.fromEntries(new FormData(event.currentTarget)),
              );
              setMessage(
                "Your profile has been saved. Existing reservation guest details remain as booked.",
              );
            } catch (error) {
              setError(
                error instanceof Error
                  ? error.message
                  : "Could not save your profile.",
              );
            }
          }}
        >
          <p>Verified email: {result.data.profile.email}</p>
          <div className="j-fields">
            <label>
              Profile name
              <input
                name="name"
                defaultValue={result.data.profile.name}
                minLength={2}
                maxLength={100}
                required
              />
            </label>
            <label>
              Profile phone (optional)
              <input
                name="phone"
                type="tel"
                defaultValue={result.data.profile.phone}
                maxLength={40}
              />
            </label>
          </div>
          <button className="j-button">Save profile</button>
        </form>
      )}
      {message && <p role="status">{message}</p>}
      <Link className="text-link" href="/my-stay">
        Back to My VIERCYS ↗
      </Link>
    </Shell>
  );
}

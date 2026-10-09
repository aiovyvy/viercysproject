"use client";
import { useState } from "react";
import Link from "next/link";
import { api, useData, Feedback } from "./journey";
import type { InviteRow } from "@/lib/invites";
type Created = { id: string; label: string; url: string; expires: number };
function day(ms: number) {
  return new Date(ms).toISOString().slice(0, 10);
}
export function InviteManager({ manager }: { manager: boolean }) {
  const list = useData<{ invites: InviteRow[]; now: number }>("/api/admin/invites");
  const [created, setCreated] = useState<Created[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState("");
  async function generate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const result = await api<{ created: Created[] }>("/api/admin/invites", {
        count: Number(form.get("count")),
        label: String(form.get("label") || ""),
        days: Number(form.get("days")),
      });
      setCreated(result.created);
      list.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not create invites.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
    } catch {
      setCopied("");
      setError("Copy failed. Select the link text and copy it manually.");
    }
  }
  const now = list.data?.now ?? 0;
  return (
    <section aria-labelledby="invites-heading">
      <h2 id="invites-heading">Demo invitations</h2>
      <p>
        Each link carries one three-night demo voucher and works for one
        confirmed booking. Give every participant their own link. Links are
        stored hashed, so they are shown only once, right after you create them.
      </p>
      {manager ? (
        <form className="j-fields" onSubmit={generate}>
          <label>
            Number of links (1–60)
            <input
              name="count"
              type="number"
              min="1"
              max="60"
              defaultValue="1"
              required
            />
          </label>
          <label>
            Label (optional, e.g. class or student)
            <input name="label" maxLength={80} placeholder="HCI class" />
          </label>
          <label>
            Valid for (days)
            <input
              name="days"
              type="number"
              min="1"
              max="365"
              defaultValue="30"
              required
            />
          </label>
          <div>
            <button className="j-button" type="submit" disabled={busy}>
              {busy ? "Creating…" : "Create invitation links"}
            </button>
          </div>
        </form>
      ) : (
        <p className="j-note">Only managers can create invitations.</p>
      )}
      <Feedback error={error || list.error} />
      {created.length > 0 && (
        <div className="j-alert">
          <h3>New links — copy them now</h3>
          <button
            type="button"
            className="j-button secondary"
            onClick={() =>
              copy(
                created
                  .map(
                    (item) => (item.label ? item.label + ": " : "") + item.url,
                  )
                  .join("\n"),
                "all",
              )
            }
          >
            {copied === "all" ? "Copied all links" : "Copy all links"}
          </button>
          <ol className="invite-created">
            {created.map((item) => (
              <li key={item.id}>
                {item.label && <strong>{item.label}: </strong>}
                <code>{item.url}</code>{" "}
                <button
                  type="button"
                  className="j-link"
                  onClick={() => copy(item.url, item.id)}
                >
                  {copied === item.id ? "Copied" : "Copy"}
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}
      <div className="j-table-wrap">
        <table className="j-table">
          <thead>
            <tr>
              <th>Label</th>
              <th>Link ends</th>
              <th>Expires</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {list.data?.invites.map((invite) => (
              <tr key={invite.id}>
                <td>{invite.label || "—"}</td>
                <td>…{invite.hint}</td>
                <td>{day(invite.expires_at)}</td>
                <td>
                  {invite.reference ? (
                    <>
                      Redeemed ·{" "}
                      <Link href={"/booking/" + invite.reference}>
                        {invite.reference}
                      </Link>
                    </>
                  ) : invite.expires_at <= now ? (
                    "Expired"
                  ) : (
                    "Unused"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {list.data?.invites.length === 0 && <p>No invitations yet.</p>}
    </section>
  );
}

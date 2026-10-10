"use client";
import { useState } from "react";
import Link from "next/link";
import { api, useData, Feedback } from "./journey";
import type { ClassCampaign } from "@/lib/class-invites";
type Created = {
  url: string;
  credentials: { identifier: string; code: string }[];
};
type RecordRow = {
  campaign_id: string;
  reference: string;
  student_identifier: string;
  name: string;
  status: string;
  arrival: string;
  departure: string;
};
export function ClassInviteManager() {
  const list = useData<{
    campaigns: (ClassCampaign & { state: string })[];
    records: RecordRow[];
  }>("/api/admin/class-invites");
  const [created, setCreated] = useState<Created | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (
      created &&
      !window.confirm(
        "Have you saved the current shared link and private claim codes? Creating another campaign replaces their one-time display.",
      )
    )
      return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      setCreated(
        await api<Created>("/api/admin/class-invites", {
          name: form.get("name"),
          limit: Number(form.get("limit")),
          expires: new Date(String(form.get("expires"))).toISOString(),
          active: form.get("status") === "active",
          roster: form.get("roster"),
        }),
      );
      setCopied(false);
      list.refresh();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Could not create campaign.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function toggle(id: string, active: boolean) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await api("/api/admin/class-invites", { action: "status", id, active });
      list.refresh();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Could not update campaign.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(created!.url);
      setCopied(true);
    } catch {
      setError("Select the shared link and copy it manually.");
    }
  }
  return (
    <section aria-labelledby="class-invites-heading" className="class-manager">
      <h2 id="class-invites-heading">Shared Class Invitations</h2>
      <p>
        Share one link with your class. Each successful booking uses one place;
        visits and registrations do not. Self-entered identifiers provide basic
        duplicate prevention, not identity verification. For stronger
        protection, add a preapproved roster: each identifier receives a private
        claim code to distribute individually.
      </p>
      <form className="j-fields" onSubmit={create}>
        <label>
          Campaign name
          <input
            name="name"
            placeholder="HCI Class 2026"
            required
            minLength={2}
            maxLength={80}
          />
        </label>
        <label>
          Maximum unique redemptions
          <input
            name="limit"
            type="number"
            min={1}
            max={300}
            defaultValue={30}
            required
          />
        </label>
        <label>
          Expiration (your local time)
          <input name="expires" type="datetime-local" required />
        </label>
        <label>
          Status
          <select name="status">
            <option value="active">Active</option>
            <option value="paused">Paused</option>
          </select>
        </label>
        <label>
          Eligible student identifiers (optional, one per line)
          <textarea
            name="roster"
            rows={4}
            maxLength={20000}
            placeholder={"STUDENT-001\nSTUDENT-002"}
          />
        </label>
        <div>
          <button className="j-button" disabled={busy}>
            Create shared invitation
          </button>
        </div>
      </form>
      <Feedback error={error || list.error} />
      {created && (
        <div className="j-alert">
          <h3>Save your shared link now</h3>
          <p>
            The original link and private claim codes are shown only here,
            immediately after creation. They cannot be recovered after leaving
            or refreshing this page. Save them securely. Never post the roster
            codes in the group chat.
          </p>
          <input
            aria-label="New shared invitation URL"
            value={created.url}
            readOnly
            onFocus={(event) => event.target.select()}
          />
          <button className="j-button" type="button" onClick={copy}>
            {copied ? "Shared link copied" : "Copy Shared Link"}
          </button>
          {created.credentials.length > 0 && (
            <>
              <h4>Private per-student claim codes — send individually</h4>
              <textarea
                aria-label="Private student claim codes"
                readOnly
                rows={6}
                value={created.credentials
                  .map((item) => `${item.identifier}\t${item.code}`)
                  .join("\n")}
                onFocus={(event) => event.target.select()}
              />
            </>
          )}
        </div>
      )}
      {list.data?.campaigns.map((campaign) => (
        <article className="j-alert" key={campaign.id}>
          <h3>{campaign.name}</h3>
          <p>
            {campaign.redemptions}/{campaign.max_redemptions} claimed ·{" "}
            {campaign.state} ·{" "}
            {campaign.roster_required
              ? "Private roster codes required"
              : "Self-entered identifiers"}
          </p>
          <p>
            Created {campaign.created_at} UTC · Expires{" "}
            {new Date(campaign.expires_at).toLocaleString()}
          </p>
          <p>
            The shared link was displayed only at creation. Use your saved copy.
          </p>
          <button
            className="j-button secondary"
            disabled={
              busy || campaign.state === "expired" || campaign.state === "full"
            }
            onClick={() => toggle(campaign.id, !campaign.active)}
          >
            {campaign.active ? "Pause campaign" : "Resume campaign"}
          </button>
          <ul>
            {list.data?.records
              .filter((record) => record.campaign_id === campaign.id)
              .map((record) => (
                <li key={record.reference}>
                  {record.student_identifier} · {record.name} ·{" "}
                  <Link href={`/booking/${record.reference}`}>
                    {record.reference}
                  </Link>{" "}
                  · {record.arrival}–{record.departure} · {record.status}
                </li>
              ))}
          </ul>
        </article>
      ))}
    </section>
  );
}

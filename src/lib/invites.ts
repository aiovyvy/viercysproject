import { randomBytes, randomUUID } from "node:crypto";
import { db, hash } from "./db";
import { VOUCHER } from "./policy";
export type InviteState = "valid" | "expired" | "redeemed" | "invalid";
export type InviteRow = {
  id: string;
  hint: string;
  label: string;
  campaign: string;
  nights: number;
  expires_at: number;
  created_at: string;
  reference: string | null;
  redeemed_at: string | null;
};
export const INVITE_COOKIE = "viercys_invite";
const TOKEN = /^[A-Za-z0-9_-]{20,100}$/;
export async function createInvites(
  count: number,
  options: {
    label?: string;
    campaign?: string;
    days?: number;
  } = {},
) {
  if (!Number.isInteger(count) || count < 1 || count > 60)
    throw new Error("Generate between 1 and 60 invitations at a time.");
  const days = options.days ?? VOUCHER.inviteDays;
  if (!Number.isInteger(days) || days < 1 || days > 365)
    throw new Error("Invitation validity must be 1–365 days.");
  const label = String(options.label || "").slice(0, 80);
  const campaign = String(options.campaign || "classroom-demo").slice(0, 80);
  const expires = Date.now() + days * 86400000;
  const created = Array.from({ length: count }, (_, index) => {
    const token = randomBytes(24).toString("base64url");
    return {
      id: randomUUID(),
      token,
      hint: token.slice(-4),
      label: count > 1 && label ? `${label} ${index + 1}` : label,
      expires,
    };
  });
  await db().batch(
    created.map((item) => ({
      sql: "INSERT INTO invites(id,token_hash,hint,label,campaign,nights,expires_at) VALUES(?,?,?,?,?,?,?)",
      args: [
        item.id,
        hash(item.token),
        item.hint,
        item.label,
        campaign,
        VOUCHER.nights,
        expires,
      ],
    })),
  );
  return created;
}

export async function findInvite(token: string | undefined | null): Promise<{
  state: InviteState;
  invite: InviteRow | null;
}> {
  if (!token || !TOKEN.test(token)) return { state: "invalid", invite: null };
  const invite = (await db()
    .prepare("SELECT * FROM invites WHERE token_hash=?")
    .get(hash(token))) as unknown as InviteRow | undefined;
  if (!invite) return { state: "invalid", invite: null };
  if (invite.reference) return { state: "redeemed", invite };
  if (invite.expires_at <= Date.now()) return { state: "expired", invite };
  return { state: "valid", invite };
}
export const INVITE_MESSAGES: Record<Exclude<InviteState, "valid">, string> = {
  invalid:
    "This invitation link is not recognised. Check that the whole link was copied, or book without a voucher.",
  expired:
    "This invitation has expired. You can still book at the standard demo rate.",
  redeemed:
    "This invitation has already been used to confirm a reservation. Each voucher works for one booking.",
};
/** Must run inside the booking transaction so a voucher is redeemed once. */
export async function redeemInvite(token: string, reference: string) {
  const { state, invite } = await findInvite(token);
  if (state !== "valid") throw new Error(INVITE_MESSAGES[state]);
  const result = await db()
    .prepare(
      "UPDATE invites SET reference=?,redeemed_at=CURRENT_TIMESTAMP WHERE id=? AND reference IS NULL AND expires_at>?",
    )
    .run(reference, invite!.id, Date.now());
  if (Number(result.changes) !== 1) throw new Error(INVITE_MESSAGES.redeemed);
  return invite!.id;
}
export async function releaseInvite(reference: string) {
  await db()
    .prepare(
      "UPDATE invites SET reference=NULL,redeemed_at=NULL WHERE reference=?",
    )
    .run(reference);
}
export async function listInvites() {
  return (await db()
    .prepare(
      "SELECT id,hint,label,campaign,nights,expires_at,created_at,reference,redeemed_at FROM invites ORDER BY created_at DESC,rowid DESC",
    )
    .all()) as unknown as InviteRow[];
}

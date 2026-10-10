import { randomBytes, randomUUID } from "node:crypto";
import { db, hash, transaction } from "./db";
import { createInvites } from "./invites";

export type ClassCampaign = {
  id: string;
  name: string;
  max_redemptions: number;
  redemptions: number;
  expires_at: number;
  active: number;
  roster_required: number;
  created_at: string;
};
export type ClassClaim = {
  invite_id: string;
  campaign_id: string;
  student_hash: string;
  student_identifier: string;
  name: string;
  email: string;
};
export function studentIdentifier(value: unknown) {
  const identifier = String(value ?? "")
    .normalize("NFKC")
    .trim()
    .toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9._-]{1,63}$/.test(identifier))
    throw new Error(
      "Enter your student identifier using 2–64 letters, numbers, dots, hyphens or underscores.",
    );
  return identifier;
}
function studentHash(campaign: string, identifier: string) {
  return hash(campaign + ":" + identifier);
}
export function campaignState(campaign: ClassCampaign | null) {
  if (!campaign) return "invalid";
  if (campaign.expires_at <= Date.now()) return "expired";
  if (!campaign.active) return "paused";
  if (campaign.redemptions >= campaign.max_redemptions) return "full";
  return "active";
}
export const CLASS_MESSAGES = {
  invalid:
    "We couldn’t find this class invitation. Ask your host for the complete link.",
  expired:
    "This class invitation has expired. Please contact your classroom host.",
  paused: "Your host has paused this invitation. Please check back with them.",
  full: "All invitations have been claimed. Thank you for being part of the VIERCYS journey.",
};
export async function findCampaign(token: unknown) {
  if (typeof token !== "string" || !/^[A-Za-z0-9_-]{32}$/.test(token))
    return null;
  return (
    ((await db()
      .prepare(
        "SELECT id,name,max_redemptions,redemptions,expires_at,active,roster_required,created_at FROM class_campaigns WHERE token_hash=?",
      )
      .get(hash(token))) as unknown as ClassCampaign | undefined) ?? null
  );
}
export async function createCampaign(input: {
  name: unknown;
  limit: unknown;
  expires: unknown;
  active: unknown;
  roster?: unknown;
}) {
  const name = String(input.name ?? "").trim();
  const limit = Number(input.limit);
  const expires = Date.parse(String(input.expires));
  if (name.length < 2 || name.length > 80)
    throw new Error("Enter a campaign name of 2–80 characters.");
  if (!Number.isInteger(limit) || limit < 1 || limit > 300)
    throw new Error("Choose a limit between 1 and 300.");
  if (
    !Number.isFinite(expires) ||
    expires <= Date.now() ||
    expires > Date.now() + 366 * 86400000
  )
    throw new Error("Choose an expiration within the next year.");
  if (typeof input.active !== "boolean")
    throw new Error("Choose active or paused.");
  if (typeof input.roster !== "undefined" && typeof input.roster !== "string")
    throw new Error("Enter one student identifier per line.");
  const rawRoster = String(input.roster ?? "");
  if (rawRoster.length > 20000) throw new Error("The roster is too long.");
  const identifiers = rawRoster
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map(studentIdentifier);
  if (
    identifiers.length > 300 ||
    new Set(identifiers).size !== identifiers.length
  )
    throw new Error("Use up to 300 unique roster identifiers.");
  const id = randomUUID();
  const token = randomBytes(24).toString("base64url");
  const credentials = identifiers.map((identifier) => ({
    identifier,
    code: randomBytes(18).toString("base64url"),
  }));
  await transaction(async () => {
    await db()
      .prepare(
        "INSERT INTO class_campaigns(id,token_hash,name,max_redemptions,expires_at,active,roster_required) VALUES(?,?,?,?,?,?,?)",
      )
      .run(
        id,
        hash(token),
        name,
        limit,
        expires,
        Number(input.active),
        Number(identifiers.length > 0),
      );
    for (const item of credentials)
      await db()
        .prepare("INSERT INTO class_roster VALUES(?,?,?)")
        .run(id, studentHash(id, item.identifier), hash(item.code));
  });
  return { id, token, credentials };
}
export async function registerClass(input: {
  token: unknown;
  name: unknown;
  identifier: unknown;
  email?: unknown;
  credential?: unknown;
}) {
  const name = String(input.name ?? "").trim();
  const email = String(input.email ?? "")
    .trim()
    .toLowerCase();
  const identifier = studentIdentifier(input.identifier);
  if (name.length < 2 || name.length > 100)
    throw new Error("Enter your full name (2–100 characters).");
  if (
    email &&
    (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
  )
    throw new Error("Enter a valid email or leave it blank.");
  return transaction(async () => {
    const campaign = await findCampaign(input.token);
    const state = campaignState(campaign);
    if (state !== "active") throw new Error(CLASS_MESSAGES[state]);
    const student = studentHash(campaign!.id, identifier);
    if (campaign!.roster_required) {
      const eligible = await db()
        .prepare(
          "SELECT 1 FROM class_roster WHERE campaign_id=? AND student_hash=? AND credential_hash=?",
        )
        .get(
          campaign!.id,
          student,
          hash(String(input.credential ?? "").trim()),
        );
      if (!eligible)
        throw new Error(
          "Check your student identifier and private claim code with your classroom host.",
        );
    }
    if (
      await db()
        .prepare(
          "SELECT 1 FROM class_redemptions WHERE campaign_id=? AND student_hash=?",
        )
        .get(campaign!.id, student)
    )
      throw new Error(
        "This student identifier has already claimed this invitation. Use your saved confirmation or ask your host for help.",
      );
    const [invite] = await createInvites(1, {
      campaign: campaign!.id,
      label: "Shared classroom invitation",
      days: 365,
    });
    await db()
      .prepare("UPDATE invites SET expires_at=? WHERE id=?")
      .run(campaign!.expires_at, invite.id);
    await db()
      .prepare("INSERT INTO class_claims VALUES(?,?,?,?,?,?)")
      .run(invite.id, campaign!.id, student, identifier, name, email);
    return { token: invite.token, expires: campaign!.expires_at };
  });
}
export async function classClaim(inviteId?: string | null) {
  if (!inviteId) return null;
  return (
    ((await db()
      .prepare("SELECT * FROM class_claims WHERE invite_id=?")
      .get(inviteId)) as unknown as ClassClaim | undefined) ?? null
  );
}
/** Called inside the existing booking transaction, after room allocation. */
export async function redeemClass(claim: ClassClaim, reference: string) {
  if (
    await db()
      .prepare(
        "SELECT 1 FROM class_redemptions WHERE campaign_id=? AND student_hash=?",
      )
      .get(claim.campaign_id, claim.student_hash)
  )
    throw new Error(
      "This student identifier has already claimed this invitation.",
    );
  await db()
    .prepare(
      "INSERT INTO class_redemptions(campaign_id,student_hash,invite_id,reference) VALUES(?,?,?,?)",
    )
    .run(claim.campaign_id, claim.student_hash, claim.invite_id, reference);
}
export async function listCampaigns() {
  const campaigns = (await db()
    .prepare(
      "SELECT id,name,max_redemptions,redemptions,expires_at,active,roster_required,created_at FROM class_campaigns ORDER BY created_at DESC,rowid DESC",
    )
    .all()) as unknown as ClassCampaign[];
  const records = await db()
    .prepare(
      "SELECT r.campaign_id,r.reference,c.student_identifier,b.name,b.status,b.arrival,b.departure FROM class_redemptions r JOIN class_claims c ON c.invite_id=r.invite_id JOIN bookings b ON b.reference=r.reference ORDER BY r.created_at DESC",
    )
    .all();
  return {
    campaigns: campaigns.map((item) => ({
      ...item,
      state: campaignState(item),
    })),
    records,
  };
}
export async function pauseCampaign(id: unknown, active: unknown) {
  if (typeof id !== "string" || typeof active !== "boolean")
    throw new Error("Choose a valid campaign and status.");
  const result = await db()
    .prepare("UPDATE class_campaigns SET active=? WHERE id=?")
    .run(Number(active), id);
  if (!result.changes) throw new Error("Campaign not found.");
}

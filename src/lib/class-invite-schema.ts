// Additive schema only: never changes existing reservations, vouchers or staff.
export const CLASS_INVITATION_SCHEMA = `
CREATE TABLE IF NOT EXISTS class_campaigns(id TEXT PRIMARY KEY,token_hash TEXT UNIQUE NOT NULL,name TEXT NOT NULL,max_redemptions INTEGER NOT NULL CHECK(max_redemptions BETWEEN 1 AND 300),redemptions INTEGER NOT NULL DEFAULT 0 CHECK(redemptions BETWEEN 0 AND max_redemptions),expires_at INTEGER NOT NULL,active INTEGER NOT NULL CHECK(active IN(0,1)),roster_required INTEGER NOT NULL CHECK(roster_required IN(0,1)),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS class_roster(campaign_id TEXT NOT NULL REFERENCES class_campaigns(id),student_hash TEXT NOT NULL,credential_hash TEXT NOT NULL,PRIMARY KEY(campaign_id,student_hash));
CREATE TABLE IF NOT EXISTS class_claims(invite_id TEXT PRIMARY KEY REFERENCES invites(id),campaign_id TEXT NOT NULL REFERENCES class_campaigns(id),student_hash TEXT NOT NULL,student_identifier TEXT NOT NULL,name TEXT NOT NULL,email TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS class_redemptions(campaign_id TEXT NOT NULL REFERENCES class_campaigns(id),student_hash TEXT NOT NULL,invite_id TEXT UNIQUE NOT NULL REFERENCES class_claims(invite_id),reference TEXT UNIQUE NOT NULL REFERENCES bookings(reference),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(campaign_id,student_hash));
CREATE TRIGGER IF NOT EXISTS class_redemption_guard BEFORE INSERT ON class_redemptions BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM class_campaigns WHERE id=NEW.campaign_id AND active=1 AND expires_at>CAST((julianday('now')-2440587.5)*86400000 AS INTEGER) AND redemptions<max_redemptions) THEN RAISE(ABORT,'This class invitation is paused, expired or fully claimed.') END;
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM class_claims claim JOIN bookings booking ON booking.reference=NEW.reference WHERE claim.invite_id=NEW.invite_id AND claim.campaign_id=NEW.campaign_id AND claim.student_hash=NEW.student_hash AND booking.invite_id=NEW.invite_id AND booking.status='confirmed' AND julianday(booking.departure)-julianday(booking.arrival)=3 AND booking.room_count=1) THEN RAISE(ABORT,'Class invitations require exactly three nights and one room.') END;
END;
CREATE TRIGGER IF NOT EXISTS class_redemption_count AFTER INSERT ON class_redemptions BEGIN UPDATE class_campaigns SET redemptions=redemptions+1 WHERE id=NEW.campaign_id; END;

CREATE TRIGGER IF NOT EXISTS class_booking_stay_guard BEFORE UPDATE OF arrival,departure,room_count ON bookings WHEN EXISTS(SELECT 1 FROM class_redemptions WHERE reference=OLD.reference) BEGIN SELECT CASE WHEN julianday(NEW.departure)-julianday(NEW.arrival)<>3 OR NEW.room_count<>1 THEN RAISE(ABORT,'Class reservations must remain exactly three nights in one room.') END; END;
`;

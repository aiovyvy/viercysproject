import { cookies } from "next/headers";
import { session, staffAccessEnabled } from "@/lib/db";
import { StaffDashboard, StaffLogin } from "@/components/journey-admin";
export default async function Admin() {
  const auth = await session((await cookies()).get("viercys_staff")?.value);
  return auth?.kind === "admin" && staffAccessEnabled() ? (
    <StaffDashboard />
  ) : (
    <StaffLogin />
  );
}

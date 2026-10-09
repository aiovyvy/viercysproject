import { Lookup } from "@/components/journey-stay";
export const metadata = { title: "Find your booking | VIERCYS" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; reference?: string }>;
}) {
  const { token, reference } = await searchParams;
  return (
    <Lookup
      token={token}
      reference={/^VRC-[0-9A-F]{12}$/i.test(reference || "") ? reference : ""}
    />
  );
}

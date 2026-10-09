import { redirect } from "next/navigation";
// Superseded by /book/details; kept so old links still work.
export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams))
    if (typeof value === "string") params.set(key, value);
  redirect("/book/details?" + params);
}

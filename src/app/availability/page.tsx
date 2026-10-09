import { redirect } from "next/navigation";
// Superseded by the three-step /book flow; kept so old links still work.
export default async function Availability({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams))
    if (typeof value === "string" && key !== "property" && key !== "category")
      params.set(key, value);
  redirect(params.size ? "/book/rooms?" + params : "/book");
}

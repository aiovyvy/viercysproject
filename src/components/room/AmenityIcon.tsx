import type { AmenityIcon as Name } from "@/lib/rooms-editorial";

/** Fine-line icons drawn to match the editorial typography. */
const PATHS: Record<Name, React.ReactNode> = {
  bed: (
    <>
      <path d="M4 18V8M4 14h24v4M28 18v-3a3 3 0 0 0-3-3H14v2" />
      <path d="M7 11.5a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0" />
    </>
  ),
  terrace: (
    <>
      <path d="M5 26V13a11 11 0 0 1 22 0v13" />
      <path d="M3 26h26M9 21h14" />
      <path d="M11 17c1.6-1 3.4-1 5 0s3.4 1 5 0" />
    </>
  ),
  lounge: (
    <>
      <path d="M6 22v-6a2 2 0 0 1 4 0v2h12v-2a2 2 0 0 1 4 0v6z" />
      <path d="M9 14v-2a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v2M8 22v3M24 22v3" />
    </>
  ),
  shower: (
    <>
      <path d="M8 27V9a4 4 0 0 1 8 0" />
      <path d="M12 12h8a4 4 0 0 0-8 0z" />
      <path d="M14 16v1M18 16v1M16 19v1M13 21v1M19 21v1" />
    </>
  ),
  climate: (
    <>
      <path d="M16 4v24M6 9l20 14M26 9 6 23" />
      <path d="m13 6 3 2 3-2M13 26l3-2 3 2" />
    </>
  ),
};

export function AmenityIcon({ name }: { name: Name }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width="32"
      height="32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}

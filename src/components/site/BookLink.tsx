"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

function useVoucherActive() {
  const [active, setActive] = useState(false);
  useEffect(() => {
    let live = true;
    fetch("/api/invite", { cache: "no-store" })
      .then((response) => response.json())
      .then((result) => live && setActive(result.active === true))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  return active;
}

/** The one booking call to action; invited guests see their voucher. */
export function BookLink({
  className,
  onClick,
}: {
  className: string;
  onClick?: () => void;
}) {
  const voucher = useVoucherActive();
  return (
    <Link className={className} href="/book" onClick={onClick}>
      {voucher ? "Claim your 3-night stay" : "Book a stay"}
    </Link>
  );
}

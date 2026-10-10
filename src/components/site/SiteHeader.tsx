"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BookLink } from "./BookLink";
import { NAV_GROUPS, PRIMARY_LINKS } from "./links";
import styles from "./site.module.css";

const ALL_LINKS = NAV_GROUPS.flatMap((group) => group.links);
const PRIMARY = PRIMARY_LINKS.map(
  (href) => ALL_LINKS.find((link) => link.href === href)!,
);
const MORE = NAV_GROUPS.map((group) => ({
  ...group,
  links: group.links.filter(
    (link) => !PRIMARY_LINKS.includes(link.href) && link.href !== "/my-stay",
  ),
})).filter((group) => group.links.length > 0);

/**
 * Global header. Wide screens: four destinations inline, a "More" panel
 * for the rest, My VIERCYS and Book a stay. Narrower screens: a full-screen
 * menu with every page in four groups. Escape closes either and returns
 * focus to the button that opened it; focus stays inside the open menu.
 */
export function SiteHeader() {
  const path = usePathname();
  const inFlow = path.startsWith("/book") || path.startsWith("/invite");
  // Room pages show their own room-specific booking dock on phones.
  const roomPage = path.startsWith("/rooms/");
  const [menu, setMenu] = useState(false);
  const [more, setMore] = useState(false);
  const header = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const moreButton = useRef<HTMLButtonElement>(null);
  const close = () => {
    setMenu(false);
    setMore(false);
  };
  useEffect(() => {
    if (!menu && !more) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        (menu ? menuButton : moreButton).current?.focus();
        close();
        return;
      }
      if (event.key !== "Tab" || !menu || !header.current) return;
      // Keep keyboard focus inside the full-screen menu.
      const focusable = [
        ...header.current.querySelectorAll<HTMLElement>("a[href], button"),
      ].filter((el) => el.offsetParent !== null);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const onPointer = (event: PointerEvent) => {
      if (!header.current?.contains(event.target as Node)) close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    if (menu) document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
      document.documentElement.style.overflow = "";
    };
  }, [menu, more]);
  const current = (href: string) =>
    path === href || path.startsWith(href + "/") ? "page" : undefined;
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className={styles.header} ref={header} data-menu={menu}>
        <Link
          href="/"
          className={styles.wordmark}
          aria-label="VIERCYS home"
          onClick={close}
        >
          VIERCYS<span>HOTELS &amp; RESORTS</span>
        </Link>

        <nav aria-label="Main navigation" className={styles.desktopNav}>
          <ul>
            {PRIMARY.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={current(link.href)}
                  onClick={close}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className={styles.moreItem}>
              <button
                ref={moreButton}
                type="button"
                className={styles.moreButton}
                aria-expanded={more}
                aria-controls="site-more"
                onClick={() => setMore(!more)}
              >
                More <span aria-hidden="true">{more ? "−" : "+"}</span>
              </button>
              <div id="site-more" className={styles.morePanel} hidden={!more}>
                {MORE.map((group) => (
                  <div key={group.title}>
                    <p className={styles.groupTitle}>{group.title}</p>
                    <ul>
                      {group.links.map((link) => (
                        <li key={link.href}>
                          <Link
                            href={link.href}
                            aria-current={current(link.href)}
                            onClick={close}
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                <Link
                  href="/santorini"
                  className={styles.feature}
                  onClick={close}
                >
                  <span className={styles.featurePhoto}>
                    <Image
                      src="/images/santorini/fira-sunset.jpg"
                      alt=""
                      fill
                      sizes="220px"
                    />
                  </span>
                  <span className={styles.groupTitle}>Our first address</span>
                  <strong>Santorini, Greece</strong>
                  <span>Twenty rooms above the caldera →</span>
                </Link>
              </div>
            </li>
          </ul>
        </nav>

        <div className={styles.actions}>
          <Link
            href="/my-stay"
            className={styles.myLink}
            aria-current={current("/my-stay")}
          >
            My VIERCYS
          </Link>
          {!inFlow && <BookLink className={styles.book} onClick={close} />}
          <button
            ref={menuButton}
            type="button"
            className={styles.menuButton}
            aria-label={menu ? "Close navigation" : "Open navigation"}
            aria-expanded={menu}
            aria-controls="site-menu"
            onClick={() => {
              setMore(false);
              setMenu(!menu);
            }}
          >
            <span className={styles.menuIcon} aria-hidden="true" />
            {menu ? "Close" : "Menu"}
          </button>
        </div>

        {menu && (
          <nav
            id="site-menu"
            aria-label="Main navigation"
            className={styles.sheet}
          >
            <Link
              href="/"
              className={styles.sheetHome}
              aria-current={path === "/" ? "page" : undefined}
              onClick={close}
            >
              Home
            </Link>
            <div className={styles.sheetGroups}>
              {NAV_GROUPS.map((group, index) => (
                <div
                  key={group.title}
                  style={{ "--i": index } as React.CSSProperties}
                >
                  <p className={styles.groupTitle}>{group.title}</p>
                  <ul>
                    {group.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          aria-current={current(link.href)}
                          onClick={close}
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className={styles.sheetFoot}>
              <BookLink className={styles.sheetBook} onClick={close} />
              <p>
                Santorini, Greece · VIERCYS is a fictional hotel for a
                classroom project.
              </p>
            </div>
          </nav>
        )}
      </header>
      {!inFlow && !roomPage && (
        <nav aria-label="Quick booking">
          <BookLink className="mobile-book-action" />
        </nav>
      )}
    </>
  );
}

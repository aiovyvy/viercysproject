"use client";
import { useRef, useState } from "react";
import { addDays } from "@/lib/policy";

export function Calendar({
  value,
  onChange,
  min,
  max,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  min: string;
  max: string;
  label: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [month, setMonth] = useState((value || min).slice(0, 7));
  const [year, number] = month.split("-").map(Number);
  const first = new Date(Date.UTC(year, number - 1, 1));
  const days = new Date(Date.UTC(year, number, 0)).getUTCDate();
  const offset = (first.getUTCDay() + 6) % 7;
  function dayKeyboard(
    event: React.KeyboardEvent<HTMLButtonElement>,
    date: string,
  ) {
    const amount =
      event.key === "ArrowRight"
        ? 1
        : event.key === "ArrowLeft"
          ? -1
          : event.key === "ArrowDown"
            ? 7
            : event.key === "ArrowUp"
              ? -7
              : null;
    if (amount === null) return;
    event.preventDefault();
    const next = addDays(date, amount);
    if (next < min || next > max) return;
    const origin = event.currentTarget;
    setMonth(next.slice(0, 7));
    requestAnimationFrame(() => {
      const target = dialog.current?.querySelector<HTMLButtonElement>(
        `button[data-date="${next}"]`,
      );
      if (target) {
        origin.tabIndex = -1;
        target.tabIndex = 0;
        target.focus();
      }
    });
  }
  function move(amount: number) {
    const next = new Date(Date.UTC(year, number - 1 + amount, 1));
    setMonth(
      `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}`,
    );
  }
  return (
    <>
      <button
        type="button"
        className="calendar-open"
        aria-label={`Choose ${label} from calendar`}
        onClick={() => {
          setMonth(
            (/^\d{4}-\d{2}-\d{2}$/.test(value) ? value : min).slice(0, 7),
          );
          dialog.current?.showModal();
          requestAnimationFrame(() => {
            const selected = dialog.current?.querySelector<HTMLButtonElement>(
              `button[data-date="${value}"]:not(:disabled)`,
            );
            (
              selected ??
              dialog.current?.querySelector<HTMLButtonElement>(
                "button[data-date]:not(:disabled)",
              )
            )?.focus();
          });
        }}
      >
        Calendar
      </button>
      <dialog
        ref={dialog}
        className="date-dialog"
        aria-label={`${label} calendar`}
      >
        <div className="calendar-heading">
          <button
            type="button"
            onClick={() => move(-1)}
            disabled={month <= min.slice(0, 7)}
            aria-label="Previous month"
          >
            ←
          </button>
          <h2 aria-live="polite">
            {new Intl.DateTimeFormat("en", {
              month: "long",
              year: "numeric",
              timeZone: "UTC",
            }).format(first)}
          </h2>
          <button
            type="button"
            onClick={() => move(1)}
            disabled={month >= max.slice(0, 7)}
            aria-label="Next month"
          >
            →
          </button>
        </div>
        <div className="calendar-days">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <span key={day}>{day}</span>
          ))}
          {Array.from({ length: offset }, (_, i) => (
            <span key={`blank-${i}`} />
          ))}
          {Array.from({ length: days }, (_, i) => {
            const date = `${month}-${String(i + 1).padStart(2, "0")}`;
            return (
              <button
                type="button"
                key={date}
                data-date={date}
                tabIndex={
                  date ===
                  (value.slice(0, 7) === month
                    ? value
                    : month === min.slice(0, 7)
                      ? min
                      : `${month}-01`)
                    ? 0
                    : -1
                }
                onKeyDown={(event) => dayKeyboard(event, date)}
                disabled={date < min || date > max}
                aria-label={`${label} ${date}`}
                aria-pressed={date === value}
                onClick={() => {
                  onChange(date);
                  dialog.current?.close();
                }}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
        <button
          className="calendar-close"
          type="button"
          onClick={() => dialog.current?.close()}
        >
          Close calendar
        </button>
      </dialog>
    </>
  );
}

import { useEffect, useState } from "react";

// All supported cities are in India; used when the weather API hasn't supplied a zone yet.
export const DEFAULT_TIMEZONE = "Asia/Kolkata";

export interface LocationClock {
  /** Fractional hour (0-23.99) in the location's timezone */
  hour: number;
  /** e.g. "4:12 PM" */
  label: string;
}

function readClock(timeZone: string): LocationClock {
  const now = new Date();
  let h = now.getHours();
  let m = now.getMinutes();
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(now);
    h = Number(parts.find((p) => p.type === "hour")?.value ?? h) % 24;
    m = Number(parts.find((p) => p.type === "minute")?.value ?? m);
  } catch {
    // Invalid timezone: fall back to device local time
  }
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return { hour: h + m / 60, label: `${h12}:${m < 10 ? "0" : ""}${m} ${ampm}` };
}

/** Live device clock expressed in the given location's timezone, refreshed every 15s. */
export function useLocationClock(timeZone: string = DEFAULT_TIMEZONE): LocationClock {
  const [clock, setClock] = useState(() => readClock(timeZone));
  useEffect(() => {
    setClock(readClock(timeZone));
    const id = setInterval(() => setClock(readClock(timeZone)), 15_000);
    return () => clearInterval(id);
  }, [timeZone]);
  return clock;
}

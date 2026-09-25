import type { ClockFormat, DateFormat, Locale, WeekdayStyle } from "./settings";

export const intlLocale = (locale: Locale) => locale;

export function formatTimerDate(date: Date, locale: Locale, format: DateFormat, showWeekday: boolean, weekdayStyle: WeekdayStyle = "short") {
  const options: Intl.DateTimeFormatOptions = format === "full"
    ? { year: "numeric", month: "long", day: "numeric" }
    : format === "standard"
      ? { year: "numeric", month: "short", day: "numeric" }
      : format === "compact"
        ? { month: "short", day: "numeric" }
        : { year: "numeric", month: "2-digit", day: "2-digit" };
  if (showWeekday) options.weekday = weekdayStyle === "full" ? "long" : "short";
  return new Intl.DateTimeFormat(intlLocale(locale), options).format(date);
}

export function formatTimerClock(date: Date, locale: Locale, format: ClockFormat) {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    hour: "numeric",
    minute: "2-digit",
    ...(format === "system" ? {} : { hour12: format === "12-hour" }),
  }).format(date);
}

export function formatTimerDateTime(date: Date, locale: Locale, options: { showDate: boolean; dateFormat: DateFormat; showWeekday: boolean; weekdayStyle?: WeekdayStyle; showClock: boolean; clockFormat: ClockFormat }) {
  const parts = [
    options.showDate ? formatTimerDate(date, locale, options.dateFormat, options.showWeekday, options.weekdayStyle) : "",
    options.showClock ? formatTimerClock(date, locale, options.clockFormat) : "",
  ].filter(Boolean);
  return parts.join(" · ");
}

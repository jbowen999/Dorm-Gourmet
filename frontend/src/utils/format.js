const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

/** "Oct 30, 2026" */
export function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : dateFormatter.format(date);
}

/** "1 review" / "214 reviews" */
export function pluralize(count, singular, plural = `${singular}s`) {
  return `${count.toLocaleString()} ${count === 1 ? singular : plural}`;
}

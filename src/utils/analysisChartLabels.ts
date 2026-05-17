import { GroupByOption } from "@/src/components/AnalysisHeader";

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_MONTH = /^\d{4}-\d{2}$/;

/** Short labels for charts (limited horizontal space). */
export function formatAnalysisChartLabel(key: string, groupBy: GroupByOption): string {
  if (!key) return "";

  if (groupBy === "day" && ISO_DATE.test(key)) {
    const [, month, day] = key.split("-").map(Number);
    return `${MONTHS_SHORT[month - 1]} ${day}`;
  }

  if (groupBy === "week" && ISO_DATE.test(key)) {
    const [, month, day] = key.split("-").map(Number);
    return `${MONTHS_SHORT[month - 1]} ${day}`;
  }

  if (groupBy === "month") {
    if (ISO_MONTH.test(key)) {
      const [year, month] = key.split("-").map(Number);
      return `${MONTHS_SHORT[month - 1]} '${String(year).slice(2)}`;
    }
    if (ISO_DATE.test(key)) {
      const [, month] = key.split("-").map(Number);
      return MONTHS_SHORT[month - 1];
    }
  }

  if (key.length > 14) return `${key.slice(0, 13)}…`;
  return key;
}

/** Readable labels for list rows and period headers. */
export function formatAnalysisPeriodLabel(key: string, groupBy: GroupByOption): string {
  if (!key) return "";

  if (groupBy === "day" && ISO_DATE.test(key)) {
    const [year, month, day] = key.split("-").map(Number);
    return `${MONTHS_SHORT[month - 1]} ${day}, ${year}`;
  }

  if (groupBy === "week" && ISO_DATE.test(key)) {
    const [year, month, day] = key.split("-").map(Number);
    return `Week of ${MONTHS_SHORT[month - 1]} ${day}, ${year}`;
  }

  if (groupBy === "month") {
    if (ISO_MONTH.test(key) || ISO_DATE.test(key)) {
      const parts = key.split("-").map(Number);
      const year = parts[0];
      const month = parts[1];
      return `${MONTHS_SHORT[month - 1]} ${year}`;
    }
  }

  return key;
}

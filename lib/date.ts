/**
 * Date utilities for the app
 * All functions work with YYYY-MM-DD format strings
 */

/**
 * Get today's date in YYYY-MM-DD format (local timezone)
 */
export function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Format a date string for input[type=date]
 */
export function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Parse a YYYY-MM-DD string to a Date at noon (avoids timezone issues)
 */
export function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

/**
 * Get the difference in days between a date string and today
 * Positive = future, negative = past
 */
export function getDaysDiff(dateStr: string): number {
  const today = getTodayString();
  const [todayYear, todayMonth, todayDay] = today.split("-").map(Number);
  const [dateYear, dateMonth, dateDay] = dateStr.split("-").map(Number);

  const todayDate = new Date(todayYear, todayMonth - 1, todayDay);
  const targetDate = new Date(dateYear, dateMonth - 1, dateDay);

  const diffTime = targetDate.getTime() - todayDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Format a date string to a human-readable French string
 * e.g., "lundi 13 janvier"
 */
export function formatDateDisplay(dateStr: string): string {
  const date = parseDateString(dateStr);
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/**
 * Get a relative date label in French (capitalized)
 * - "Il y a X jours" if date < today - 1
 * - "Hier" if date = today - 1
 * - "Aujourd'hui" if date = today
 * - "Demain" if date = today + 1
 * - "Dans X jours" if date > today + 1
 */
export function getRelativeDateLabel(dateStr: string): string {
  const diff = getDaysDiff(dateStr);

  if (diff === 0) {
    return "Aujourd'hui";
  } else if (diff === 1) {
    return "Demain";
  } else if (diff === -1) {
    return "Hier";
  } else if (diff > 1) {
    return `Dans ${diff} jours`;
  } else {
    // diff < -1
    return `Il y a ${Math.abs(diff)} jours`;
  }
}

/**
 * Navigate to a new date by adding/subtracting days
 */
export function navigateDate(dateStr: string, days: number): string {
  const date = parseDateString(dateStr);
  date.setDate(date.getDate() + days);
  return formatDateForInput(date);
}

// ============================================
// EXAMPLES / TESTS
// ============================================
// Run with: npx ts-node lib/date.ts
//
// const today = getTodayString();
// console.log("Today:", today);
// console.log("Display:", formatDateDisplay(today));
// console.log("Relative:", getRelativeDateLabel(today)); // "aujourd'hui"
//
// const yesterday = navigateDate(today, -1);
// console.log("Yesterday:", yesterday);
// console.log("Relative:", getRelativeDateLabel(yesterday)); // "hier"
//
// const twoDaysAgo = navigateDate(today, -2);
// console.log("2 days ago:", twoDaysAgo);
// console.log("Relative:", getRelativeDateLabel(twoDaysAgo)); // "il y a 2 jours"
//
// const tomorrow = navigateDate(today, 1);
// console.log("Tomorrow:", tomorrow);
// console.log("Relative:", getRelativeDateLabel(tomorrow)); // "demain"
//
// const inThreeDays = navigateDate(today, 3);
// console.log("In 3 days:", inThreeDays);
// console.log("Relative:", getRelativeDateLabel(inThreeDays)); // "dans 3 jours"

/**
 * The enrollment lifecycle, as a closed union.
 *
 * An enrollment is active (has a seat), waitlisted (waiting for one), or left
 * (closed). This is the one place the three states are named; the database check
 * constraint mirrors the same three values.
 */
export type EnrollmentStatus = "active" | "waitlisted" | "left";

/** The three states, so a value can be checked without listing them again. */
export const enrollmentStatuses = ["active", "waitlisted", "left"] as const;

/** True when the value is one of the three enrollment states. */
export function isEnrollmentStatus(value: unknown): value is EnrollmentStatus {
  return typeof value === "string" && (enrollmentStatuses as readonly string[]).includes(value);
}

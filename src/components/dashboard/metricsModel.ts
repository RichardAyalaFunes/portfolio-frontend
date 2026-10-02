/**
 * The two headline numbers on the Metrics page, defined so they agree with the queue:
 * the same role counts as "to review" here and in the queue's To review bucket, and
 * "applied" means every application sent, not only the ones still sitting at "Applied".
 * Dependency-free so the tests can import it directly.
 */

/**
 * Roles waiting for a first look. The server counts them by the queue's own rule
 * (`to_review`); an older server only has the raw `To validate` status count, which
 * also includes roles already applied to or whose posting closed.
 */
export function toReviewCount(metrics: { to_review?: number; status_counts: Record<string, number> }): number {
    return metrics.to_review ?? metrics.status_counts['To validate'] ?? 0;
}

/** Every application sent: all stages after "Not applied", so a role moving on to an interview still counts. */
export function appliedCount(stageCounts: Record<string, number>): number {
    return Object.entries(stageCounts).reduce((sum, [stage, count]) => (stage === 'Not applied' ? sum : sum + count), 0);
}

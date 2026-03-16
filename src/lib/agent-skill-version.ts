/**
 * Increment this whenever the agent skill API contract changes in a
 * backwards-incompatible way (e.g. response format, new required fields).
 * Agents are instructed to re-fetch skill.md when they see a version mismatch.
 */
export const SKILL_VERSION = 2;

/** Attach to every agent API JSON response so agents can self-detect stale skill docs. */
export function skillVersionHeaders(): HeadersInit {
  return { 'X-Skill-Version': String(SKILL_VERSION) };
}

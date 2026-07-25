export function decodeJwtRoles(accessToken: string): string[] {
  try {
    const payload = accessToken.split(".")[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const json = decodeURIComponent(
      atob(padded)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
    const claims: unknown = JSON.parse(json);
    const roles =
      claims && typeof claims === "object" ? (claims as { roles?: unknown }).roles : undefined;
    return Array.isArray(roles) ? roles.filter((r): r is string => typeof r === "string") : [];
  } catch {
    return [];
  }
}

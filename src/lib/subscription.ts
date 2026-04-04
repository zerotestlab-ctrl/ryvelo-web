/** Raw value in `profiles.subscription_plan` (extend as needed). */
export type SubscriptionPlanCode = "free" | "starter" | "pro" | string;

export function formatSubscriptionPlanLabel(
  raw: string | null | undefined
): string {
  const v = (raw ?? "free").trim().toLowerCase();
  if (v === "free") return "Free";
  if (v === "starter") return "Starter";
  if (v === "pro") return "Pro";
  if (!v) return "Free";
  return v.charAt(0).toUpperCase() + v.slice(1);
}

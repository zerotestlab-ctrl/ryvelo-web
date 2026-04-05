import { revalidatePath } from "next/cache";

/**
 * Invalidates dashboard, invoices, and resolutions (pages + layouts).
 * Use after ingest, approve/reject resolution, or any mutation that affects these lists.
 */
export function revalidateAppRoutes(): void {
  revalidatePath("/dashboard");
  revalidatePath("/invoices");
  revalidatePath("/resolutions");
  revalidatePath("/dashboard", "layout");
  revalidatePath("/invoices", "layout");
  revalidatePath("/resolutions", "layout");
}

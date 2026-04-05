import { revalidatePath } from "next/cache";

/** Invalidate dashboard, invoices, and resolutions (pages + layouts) after a successful ingest. */
export function revalidateAfterIngest(): void {
  revalidatePath("/dashboard");
  revalidatePath("/invoices");
  revalidatePath("/resolutions");
  revalidatePath("/dashboard", "layout");
  revalidatePath("/invoices", "layout");
  revalidatePath("/resolutions", "layout");
}

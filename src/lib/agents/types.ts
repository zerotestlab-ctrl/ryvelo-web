/**
 * Autonomous resolution engine — shared types for LangGraph.
 *
 * Graph: **detect_issues → propose_resolution → human_review → execute_resolution → log_outcome**
 * (human gate pauses after phase 1; phase 2 runs after UI approval or automation flags).
 */

import { z } from "zod";

export type IssueType =
  | "missing_po"
  | "tax_discrepancy"
  | "fx_rate_error"
  | "wrong_amount"
  | "duplicate_invoice"
  | "client_dispute"
  | "payment_terms";

export interface Issue {
  type: IssueType;
  description: string;
  confidence: number;
  suggestedFix?: string;
}

export interface ResolutionStep {
  step: string;
  timestamp: string;
  /** LLM or tool payload for this step (JSON-serializable). */
  aiOutput: unknown;
  status: "success" | "pending" | "failed";
}

export interface ProposedResolution {
  correctedInvoice?: Record<string, unknown>;
  chaseEmailDraft?: string;
  paymentLink?: string;
}

export type ResolutionRunStatus =
  | "detecting"
  | "proposing"
  | "review"
  | "executing"
  | "completed"
  | "failed";

export interface ResolutionState {
  invoiceId: string;
  resolutionId?: string;
  profileId: string;
  clerkId: string;
  rawInvoice: Record<string, unknown>;
  issues: Issue[];
  proposedResolution: ProposedResolution;
  humanApproved?: boolean;
  amountAtStake: number;
  amountRecovered?: number;
  aiSteps: ResolutionStep[];
  status: ResolutionRunStatus;
  /** When true, skip human_review and run execute+log in the same run (QA / “Resolve now”). */
  skipHumanGate?: boolean;
  /**
   * Set when approve succeeded but email/payment tooling threw — workflow still completes
   * with `outcome_status` approved and a user-facing message.
   */
  executionWarning?: string;
}

/** Result of `runResolutionWorkflow` — UI waits on `awaiting_human`. */
export type ResolutionWorkflowResult =
  | {
      phase: "awaiting_human";
      invoiceId: string;
      resolutionId: string | undefined;
      state: ResolutionState;
    }
  | {
      phase: "completed";
      invoiceId: string;
      resolutionId: string | undefined;
      state: ResolutionState;
      /** Shown when email/payment failed after human approval. */
      warning?: string;
    }
  | {
      phase: "failed";
      invoiceId: string;
      resolutionId: string | undefined;
      state: ResolutionState;
      error?: string;
    };

export const IssueTypeSchema = z.enum([
  "missing_po",
  "tax_discrepancy",
  "fx_rate_error",
  "wrong_amount",
  "duplicate_invoice",
  "client_dispute",
  "payment_terms",
]);

export const IssueSchema = z.object({
  type: IssueTypeSchema,
  description: z.string(),
  confidence: z.number().min(0).max(1),
  suggestedFix: z.string().optional(),
});

export const ResolutionStepSchema = z.object({
  step: z.string(),
  timestamp: z.string(),
  aiOutput: z.unknown(),
  status: z.enum(["success", "pending", "failed"]),
});

export const ProposedResolutionSchema = z.object({
  correctedInvoice: z.record(z.string(), z.unknown()).optional(),
  chaseEmailDraft: z.string().optional(),
  paymentLink: z.string().optional(),
});

export const ResolutionStateSchema = z.object({
  invoiceId: z.string().uuid(),
  resolutionId: z.string().uuid().optional(),
  profileId: z.string().uuid(),
  clerkId: z.string().min(1),
  rawInvoice: z.record(z.string(), z.unknown()),
  issues: z.array(IssueSchema),
  proposedResolution: ProposedResolutionSchema,
  humanApproved: z.boolean().optional(),
  amountAtStake: z.number().nonnegative(),
  amountRecovered: z.number().nonnegative().optional(),
  aiSteps: z.array(ResolutionStepSchema),
  status: z.enum([
    "detecting",
    "proposing",
    "review",
    "executing",
    "completed",
    "failed",
  ]),
  skipHumanGate: z.boolean().optional(),
  executionWarning: z.string().optional(),
});

/** Structured LLM output for propose_resolution (Claude / OpenAI). */
export const ProposedResolutionOutputSchema = z.object({
  correctedInvoice: z.record(z.string(), z.unknown()).optional(),
  chaseEmailDraft: z.string().optional(),
  paymentLink: z.string().optional(),
  rationale: z.string().optional(),
});

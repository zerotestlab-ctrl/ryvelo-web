"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import type { ResolutionListRow } from "@/lib/data/resolutions-list";

import { ResolutionModal } from "@/components/resolutions/ResolutionModal";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { formatAmount } from "@/lib/format";

function ConfidenceCell({ value }: { value: number }) {
  const safe = Number.isFinite(value) ? value : 0;
  const pct = Math.round(Math.min(1, Math.max(0, safe)) * 100);
  return (
    <span className="tabular-nums text-foreground">
      {pct}%
    </span>
  );
}

const columns: ColumnDef<ResolutionListRow>[] = [
  {
    accessorKey: "invoiceRef",
    header: "Invoice",
    cell: ({ row }) => (
      <span className="font-medium text-foreground">{row.original.invoiceRef}</span>
    ),
  },
  {
    accessorKey: "clientName",
    header: "Client",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.clientName}</span>
    ),
  },
  {
    id: "issues",
    header: "Issues",
    cell: ({ row }) => {
      const badges = row.original.issueBadges;
      if (badges.length === 0) {
        return <span className="text-muted-foreground">—</span>;
      }
      return (
        <div className="flex max-w-[220px] flex-wrap gap-1">
          {badges.map((b) => (
            <Badge key={b} variant="secondary" className="font-normal">
              {b}
            </Badge>
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: "confidence",
    header: "AI confidence",
    cell: ({ row }) => (
      <ConfidenceCell value={row.original.confidence} />
    ),
  },
  {
    id: "amount",
    header: "Amount at stake",
    cell: ({ row }) => (
      <span className="tabular-nums text-foreground">
        {formatAmount(row.original.amountAtStake, row.original.currency)}
      </span>
    ),
  },
  {
    accessorKey: "statusLabel",
    header: "Status",
    cell: ({ row }) => {
      const s = row.original.statusLabel;
      const variant =
        s === "Resolved"
          ? "success"
          : s === "Failed"
            ? "outline"
            : s === "Partial"
              ? "warning"
              : "secondary";
      return (
        <Badge variant={variant} className="font-medium">
          {s}
        </Badge>
      );
    },
  },
  {
    id: "humanReviewed",
    header: "Human reviewed",
    cell: ({ row }) => (
      <span className="text-xs tabular-nums text-muted-foreground">
        {row.original.humanReviewed ? "Yes" : "No"}
      </span>
    ),
  },
];

type Props = {
  data: ResolutionListRow[];
};

export function ResolutionTable({ data }: Props) {
  const [selected, setSelected] = useState<ResolutionListRow | null>(null);
  const [open, setOpen] = useState(false);

  const tableData = useMemo(() => data, [data]);

  return (
    <>
      <DataTable
        columns={columns}
        data={tableData}
        emptyMessage="No resolutions yet. They appear when invoices are ingested (API or integration)."
        onRowClick={(r) => {
          setSelected(r);
          setOpen(true);
        }}
      />
      <ResolutionModal
        row={selected}
        open={open && selected !== null}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setSelected(null);
        }}
      />
    </>
  );
}

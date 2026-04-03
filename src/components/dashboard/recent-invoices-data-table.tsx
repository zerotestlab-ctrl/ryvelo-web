"use client";

import type { ComponentProps } from "react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";

import { resolveInvoiceNowAction } from "@/app/actions/resolution-ui-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { formatAmount } from "@/lib/format";
import type { InvoiceRow } from "@/lib/dashboard-placeholder";

function ResolveNowButton({ invoiceId }: { invoiceId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      className="h-8 shrink-0"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const r = await resolveInvoiceNowAction(invoiceId);
          if (r.ok) {
            router.refresh();
          } else {
            alert("Could not run resolution: " + r.error);
          }
        });
      }}
    >
      {pending ? "Running…" : "Resolve now"}
    </Button>
  );
}

function statusVariant(
  status: InvoiceRow["status"]
): ComponentProps<typeof Badge>["variant"] {
  switch (status) {
    case "Resolved":
      return "success";
    case "Due":
    case "In collections":
    case "Issues detected":
      return "warning";
    case "Disputed":
      return "outline";
    case "Failed":
      return "outline";
    case "Partially paid":
    case "In review":
      return "secondary";
    default:
      return "secondary";
  }
}

const columns: ColumnDef<InvoiceRow>[] = [
  {
    accessorKey: "client",
    header: "Client",
    cell: ({ row }) => (
      <span className="font-medium text-foreground">{row.original.client}</span>
    ),
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => (
      <span className="tabular-nums text-foreground">
        {formatAmount(row.original.amount, row.original.currency)}
      </span>
    ),
  },
  {
    accessorKey: "currency",
    header: "Currency",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.currency}</span>
    ),
  },
  {
    accessorKey: "dueDate",
    header: "Due date",
    cell: ({ row }) => (
      <span className="tabular-nums text-muted-foreground">
        {row.original.dueDate}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={statusVariant(row.original.status)}>
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "lastAction",
    header: "Last action",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.lastAction}</span>
    ),
  },
  {
    id: "resolve",
    header: "",
    cell: ({ row }) => <ResolveNowButton invoiceId={row.original.id} />,
  },
];

export function RecentInvoicesDataTable({ data }: { data: InvoiceRow[] }) {
  return <DataTable columns={columns} data={data} />;
}

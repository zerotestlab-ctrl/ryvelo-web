export default function InvoicesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Invoices</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track open balances, aging, and collections status.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="text-sm font-semibold">Open invoices</div>
          <div className="text-xs text-muted-foreground">12 results</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-t border-border bg-black/10 text-xs text-muted-foreground">
              <tr className="[&>th]:px-4 [&>th]:py-2.5 [&>th]:text-left [&>th]:font-medium">
                <th>Invoice</th>
                <th>Account</th>
                <th>Aging</th>
                <th>Status</th>
                <th className="text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                {
                  invoice: "INV-10492",
                  account: "Alpine Logistics",
                  aging: "12d",
                  status: "In collections",
                  balance: "$8,240",
                },
                {
                  invoice: "INV-10481",
                  account: "Northwind Retail",
                  aging: "3d",
                  status: "In dispute",
                  balance: "$1,120",
                },
                {
                  invoice: "INV-10477",
                  account: "Apex Manufacturing",
                  aging: "0d",
                  status: "Sent",
                  balance: "$14,600",
                },
              ].map((row) => (
                <tr key={row.invoice} className="[&>td]:px-4 [&>td]:py-3">
                  <td className="font-medium text-foreground">{row.invoice}</td>
                  <td className="text-muted-foreground">{row.account}</td>
                  <td className="text-muted-foreground">{row.aging}</td>
                  <td>
                    <span className="inline-flex items-center rounded-md border border-border bg-white/5 px-2 py-0.5 text-xs font-medium">
                      {row.status}
                    </span>
                  </td>
                  <td className="text-right tabular-nums text-foreground">
                    {row.balance}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


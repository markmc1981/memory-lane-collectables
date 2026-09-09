"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setProductStatus } from "../actions";
import { STOCK_STATUSES, type StockStatus } from "../statuses";

export function StatusControl({
  id,
  status,
}: {
  id: string;
  status: StockStatus;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted">Status</span>
      <select
        value={status}
        disabled={pending}
        onChange={(e) =>
          start(async () => {
            await setProductStatus(id, e.target.value as StockStatus);
            router.refresh();
          })
        }
        className="h-9 rounded border border-line bg-surface px-2 text-sm outline-none focus:border-ink"
      >
        {STOCK_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.replace(/_/g, " ")}
          </option>
        ))}
      </select>
    </label>
  );
}

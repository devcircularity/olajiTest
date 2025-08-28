"use client";
import { useEffect, useState } from "react";
import { getOverview } from "@/services/schools";
import type { OverviewStats } from "@/types/overview";

export default function OverviewCards() {
  const [data, setData] = useState<OverviewStats | null>(null);

  useEffect(() => {
    getOverview().then(setData).catch(() => setData(null));
  }, []);

  const items = [
    { label: "Students", value: data?.students ?? 0 },
    { label: "Classes", value: data?.classes ?? 0 },
    { label: "Fees Collected (KES)", value: data?.feesCollected ?? 0 },
    { label: "Pending Invoices", value: data?.pendingInvoices ?? 0 },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {items.map((it) => (
        <div key={it.label} className="card p-5">
          <div className="text-sm opacity-70">{it.label}</div>
          <div className="text-2xl mt-1 font-semibold">{it.value.toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}
"use client";
import { useEffect, useState } from "react";
import { getAttendanceSnapshot } from "@/services/classes";

type SnapshotItem = { className: string; present: number; total: number };

export default function StatusGlance() {
  const [rows, setRows] = useState<SnapshotItem[]>([]);

  useEffect(() => {
    getAttendanceSnapshot().then(setRows).catch(() => setRows([]));
  }, []);

  return (
    <div className="card p-5">
      <h3 className="text-lg font-semibold mb-3">Attendance snapshot</h3>
      <div className="overflow-auto -mx-3">
        <table className="w-full text-sm mx-3">
          <thead className="text-left opacity-70">
            <tr>
              <th className="py-2">Class</th>
              <th className="py-2">Present</th>
              <th className="py-2">Total</th>
              <th className="py-2">Rate</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const rate = r.total ? Math.round((r.present / r.total) * 100) : 0;
              return (
                <tr key={r.className} className="border-t border-neutral-200 dark:border-white/10">
                  <td className="py-2">{r.className}</td>
                  <td className="py-2">{r.present}</td>
                  <td className="py-2">{r.total}</td>
                  <td className="py-2">
                    <div className="w-48 bg-neutral-100 dark:bg-white/10 rounded-full">
                      <div className="h-2 bg-[--color-brand] rounded-full" style={{ width: `${rate}%` }} />
                    </div>
                    <span className="ml-2">{rate}%</span>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={4} className="py-6 text-center opacity-60">No data yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
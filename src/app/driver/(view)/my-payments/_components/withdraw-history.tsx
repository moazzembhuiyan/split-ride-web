"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export type WithdrawRequest = {
  id: string;
  amount: number;
  status: "approved" | "pending" | "rejected";
  date: string;
  time: string;
};

// TODO: replace with API fetch
const MOCK_WITHDRAWALS: WithdrawRequest[] = [
  { id: "WR001", amount: 10.0, status: "approved", date: "05 Jan 2023", time: "10:00 AM" },
  { id: "WR002", amount: 10.0, status: "approved", date: "05 Jan 2023", time: "10:00 AM" },
  { id: "WR003", amount: 10.0, status: "pending",  date: "05 Jan 2023", time: "10:00 AM" },
  { id: "WR004", amount: 10.0, status: "approved", date: "05 Jan 2023", time: "10:00 AM" },
  { id: "WR005", amount: 10.0, status: "pending",  date: "05 Jan 2023", time: "10:00 AM" },
];

const STATUS_STYLES: Record<WithdrawRequest["status"], string> = {
  approved: "bg-green-100 text-green-700 border-green-200",
  pending:  "bg-orange-100 text-orange-600 border-orange-200",
  rejected: "bg-red-100 text-red-600 border-red-200",
};

export function WithdrawHistory({ items = MOCK_WITHDRAWALS }: { items?: WithdrawRequest[] }) {
  return (
    <div className="space-y-2 w-full">
      {items.map((req) => (
        <Card key={req.id} className="py-0 shadow-none">
          <CardContent className="flex items-center gap-3 px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm leading-tight">Amount</p>
              <Badge
                className={`mt-1 text-xs font-medium border ${STATUS_STYLES[req.status]}`}
                variant="outline"
              >
                {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
              </Badge>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground shrink-0">
              <span>{req.date}</span>
              <span className="opacity-40">|</span>
              <span>{req.time}</span>
            </div>

            <p className="font-bold text-sm text-transparent bg-linear-to-r from-cyan-500 to-violet-500 bg-clip-text shrink-0 ml-2">
              $ {req.amount.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

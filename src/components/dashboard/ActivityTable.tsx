"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const activityRows = [
  {
    id: "TX-001",
    type: "Sent",
    amount: -15000,
    currency: "KRW",
    status: "COMPLETED",
  },
  {
    id: "TX-002",
    type: "Received",
    amount: 50000,
    currency: "KRW",
    status: "COMPLETED",
  },
  {
    id: "TX-003",
    type: "Payment",
    amount: -2150.5,
    currency: "PHP",
    status: "FAILED",
  },
];

function HexPattern({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 32" fill="none">
      <defs>
        <pattern
          id="hex"
          patternUnits="userSpaceOnUse"
          width="32"
          height="32"
          patternTransform="scale(1)"
        >
          <polygon
            points="16,2 30,10 30,26 16,34 2,26 2,10"
            fill="#0083D7"
            fillOpacity="0.2"
          />
        </pattern>
      </defs>
      <rect width="120" height="32" fill="url(#hex)" />
    </svg>
  );
}

export default function ActivityTable() {
  return (
    <div className="relative rounded-2xl overflow-hidden">
      {/* Hex pattern background for header */}
      <HexPattern className="absolute inset-0 w-full h-16 opacity-5 pointer-events-none" />
      <Table className="relative z-10">
        <TableHeader>
          <TableRow>
            <TableHead className="font-mono">Transaction ID</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="font-mono text-right">Amount</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activityRows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-mono">{row.id}</TableCell>
              <TableCell>{row.type}</TableCell>
              <TableCell className="font-mono text-right">
                {row.amount > 0 ? "+" : ""}
                {row.amount.toLocaleString(undefined, {
                  style: "currency",
                  currency: row.currency,
                })}
              </TableCell>
              <TableCell>
                <Badge
                  variant={row.status === "COMPLETED" ? "success" : "destructive"}
                  className={row.status === "COMPLETED" ? "bg-green-500" : "bg-red-500"}
                >
                  {row.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 
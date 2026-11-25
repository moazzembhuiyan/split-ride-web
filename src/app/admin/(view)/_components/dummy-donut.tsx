"use client";
import { Pie, PieChart } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export const description = "A donut chart";

const chartConfig = {
  income: {
    label: "Net income",
    color: "var(--primary)",
  },
  expense: {
    label: "Platform commission",
    color: "var(--chart-2)",
  },
  cancellation: {
    label: "Refunded",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export interface DonutItem {
  key: "income" | "expense" | "cancellation";
  label: string;
  value: number;
  fill: string;
}

export function DummyDonut({ data }: { data: DonutItem[] }) {
  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square h-full w-full"
    >
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent nameKey="label" />}
        />
        <Pie
          data={data}
          dataKey="value"
          nameKey="label"
          innerRadius={70}
        />
      </PieChart>
    </ChartContainer>
  );
}

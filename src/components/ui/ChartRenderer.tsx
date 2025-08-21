"use client";

import { AreaChart, BarChart, DonutChart, LineChart } from "@tremor/react";

interface ChartSuggestion {
  type: string;
  title: string;
  props: {
    index: string;
    categories: string[];
    [key: string]: any; // TODO: Define more specific types for props
  };
}

interface ChartRendererProps {
  suggestion: ChartSuggestion;
  data: any[];
}

export function ChartRenderer({ suggestion, data }: ChartRendererProps) {
  const { type, props } = suggestion;

  switch (type) {
    case "BarChart":
      return <BarChart data={data} {...props} yAxisWidth={48} />;

    case "LineChart":
      return <LineChart data={data} {...props} yAxisWidth={48} />;

    case "AreaChart":
      return <AreaChart data={data} {...props} yAxisWidth={48} />;

    case "DonutChart":
      return <DonutChart data={data} {...props} />;

    default:
      return (
        <p className="text-center text-sm text-gray-500">
          Unknown chart type: {type}
        </p>
      );
  }
}

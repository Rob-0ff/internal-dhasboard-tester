// src/components/ChartRenderer.tsx
"use client";

// Import all the Tremor chart types you want to support
import { AreaChart, BarChart, DonutChart, LineChart } from "@tremor/react";

// Define a type for our chart suggestion object from the API
interface ChartSuggestion {
  type: string;
  title: string;
  props: {
    index: string;
    categories: string[];
    [key: string]: any; // Allow other props
  };
}

interface ChartRendererProps {
  suggestion: ChartSuggestion;
  data: any[];
}

export function ChartRenderer({ suggestion, data }: ChartRendererProps) {
  const { type, props } = suggestion;

  // This switch statement acts as a dynamic router for your charts
  switch (type) {
    case "BarChart":
      return <BarChart data={data} {...props} yAxisWidth={48} />;

    case "LineChart":
      return <LineChart data={data} {...props} yAxisWidth={48} />;

    case "AreaChart":
      return <AreaChart data={data} {...props} yAxisWidth={48} />;

    case "DonutChart":
      return <DonutChart data={data} {...props} />;

    // Add more cases here for other Tremor charts you want to support

    default:
      // Return null or a fallback message if the chart type is unknown
      return (
        <p className="text-center text-sm text-gray-500">
          Unknown chart type: {type}
        </p>
      );
  }
}

"use client";

import { AreaChart, BarChart, DonutChart, LineChart } from "@tremor/react";

interface ChartSuggestion {
  type: string;
  title: string;
  props: {
    index: string;
    // 'categories' is for multi-series charts, 'category' is for single-series like Donut
    categories?: string[];
    category?: string;
    colors?: string[];
    [key: string]: any;
  };
}

interface ChartRendererProps {
  suggestion: ChartSuggestion;
  data: any[];
}

export function ChartRenderer({ suggestion, data }: ChartRendererProps) {
  const { type, props } = suggestion;

  const { title, ...chartProps } = props;

  switch (type) {
    case "BarChart":
      return (
        <BarChart
          data={data}
          index={chartProps.index}
          categories={chartProps.categories ?? []}
          colors={chartProps.colors}
          yAxisWidth={48}
          showXAxis={true}
        />
      );

    case "LineChart":
      return (
        <LineChart
          data={data}
          index={chartProps.index}
          categories={chartProps.categories ?? []}
          colors={chartProps.colors}
          yAxisWidth={48}
          connectNulls={true}
        />
      );

    case "AreaChart":
      return (
        <AreaChart
          data={data}
          index={chartProps.index}
          categories={chartProps.categories ?? []}
          colors={chartProps.colors}
          yAxisWidth={48}
          connectNulls={true}
        />
      );

    case "DonutChart":
      return <DonutChart className="mx-auto" data={data} {...chartProps} />;

    default:
      return (
        <p className="text-center text-sm text-gray-500">
          Unknown chart type: {type}
        </p>
      );
  }
}

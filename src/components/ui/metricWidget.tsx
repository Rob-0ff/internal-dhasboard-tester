"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartRenderer } from "@/components/ui/ChartRenderer";
import { SavedMetric } from "@/lib/types";
import { AlertTriangle } from "lucide-react";

interface MetricWidgetProps {
  metric: SavedMetric;
}

export function MetricWidget({ metric }: MetricWidgetProps) {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // This is the 'handleMetricData' logic, encapsulated within the component.
    const fetchData = async () => {
      // We don't need to re-validate the metric prop, useEffect handles it.
      setIsLoading(true);
      setError("");
      try {
        const response = await fetch("/api/metrics/execute", {
          method: "POST",
          body: JSON.stringify({ sql_query: metric.sql_query }),
          headers: { "Content-Type": "application/json" },
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || "Failed to fetch data.");
        }
        setData(result);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [metric]); // This effect re-runs if the metric prop ever changes.

  return (
    <Card className="h-full w-full flex flex-col border-none shadow-none">
      <CardHeader className="p-2">
        <CardTitle className="text-base truncate">{metric.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-2">
        {isLoading && <Skeleton className="h-full w-full" />}

        {error && (
          <div className="flex flex-col items-center justify-center h-full text-red-500">
            <AlertTriangle className="mb-2" />
            <p className="text-xs text-center">{error}</p>
          </div>
        )}

        {!isLoading && !error && data.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-center text-gray-500">No data found.</p>
          </div>
        )}

        {!isLoading && !error && data.length > 0 && (
          <ChartRenderer suggestion={metric.chart_suggestion} data={data} />
        )}
      </CardContent>
    </Card>
  );
}

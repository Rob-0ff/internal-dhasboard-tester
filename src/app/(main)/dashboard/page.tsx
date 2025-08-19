// src/app/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";
import { MetricViewModal } from "@/components/ui/metricViewModal"; // Ensure this path is correct
import { SavedMetric } from "@/lib/types";

export default function Dashboard() {
  const [metrics, setMetrics] = useState<SavedMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<SavedMetric | null>(
    null
  );

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch("/api/metrics");
        if (!response.ok) throw new Error("Failed to fetch metrics");
        const data = await response.json();
        setMetrics(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  const handleMetricUpdated = (updatedMetric: SavedMetric) => {
    setMetrics(
      metrics.map((m) => (m.id === updatedMetric.id ? updatedMetric : m))
    );
    setSelectedMetric(updatedMetric);
  };

  const handleMetricDeleted = (metricId: string) => {
    setMetrics(metrics.filter((m) => m.id !== metricId));
  };

  return (
    <main className="p-8">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <Link href="/newMetric">
          <Card className="h-[135px] flex items-center justify-center shadow-xl shadow-purple-500/25 group cursor-pointer transition-all hover:border-purple-500">
            <CardContent className="p-0">
              <Plus
                size={32}
                className="text-purple-500 transition-transform group-hover:scale-110"
              />
            </CardContent>
          </Card>
        </Link>

        {isLoading
          ? Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="h-[135px]">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))
          : metrics.map((metric) => (
              <Card
                key={metric.id}
                className="cursor-pointer hover:shadow-lg transition-shadow h-[135px]"
                onClick={() => setSelectedMetric(metric)}
              >
                <CardHeader>
                  <CardTitle className="truncate">{metric.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">
                    Chart: {metric.chart_suggestion.type}
                  </p>
                </CardContent>
              </Card>
            ))}
      </div>

      <MetricViewModal
        open={!!selectedMetric}
        metric={selectedMetric}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setSelectedMetric(null);
          }
        }}
        onMetricUpdated={handleMetricUpdated}
        onMetricDeleted={handleMetricDeleted}
      />
    </main>
  );
}

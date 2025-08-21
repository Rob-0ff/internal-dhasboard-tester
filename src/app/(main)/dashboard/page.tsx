// src/app/dashboard/page.tsx
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  GripVertical,
  Save,
  ChevronRight,
  ChevronLeft,
  SaveIcon,
} from "lucide-react";
import { SavedMetric } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { MetricWidget } from "@/components/ui/metricWidget";
import { MetricViewModal } from "@/components/ui/metricViewModal";
import { useSingleAndDoubleClick } from "@/app/hooks/useSingleAndDoubleClick";

// --- React Grid Layout Imports ---
import { Responsive, WidthProvider } from "react-grid-layout";
import type { Layout, Layouts } from "react-grid-layout";
import "@/styles/grid-layout.css";

const ResponsiveGridLayout = WidthProvider(Responsive);

// --- Sub-component for Grid Widgets ---
function DraggableMetricWidget({
  metric,
  onSingleClick,
  onDoubleClick,
}: {
  metric: SavedMetric;
  onSingleClick: () => void;
  onDoubleClick: () => void;
}) {
  const clickHandler = useSingleAndDoubleClick(onSingleClick, onDoubleClick);

  return (
    <div
      onMouseDown={clickHandler}
      className="bg-white rounded-lg shadow p-1 overflow-hidden h-full w-full cursor-pointer"
    >
      <MetricWidget metric={metric} />
    </div>
  );
}

export default function DashboardPage() {
  const [allMetrics, setAllMetrics] = useState<SavedMetric[]>([]);
  const [liveLayouts, setLiveLayouts] = useState<Layouts>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<SavedMetric | null>(
    null
  );
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const dashboardMetrics = allMetrics.filter((m) =>
    liveLayouts.lg?.some((l) => l.i === m.id)
  );

  useEffect(() => {
    const fetchMetrics = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/metrics");
        if (!response.ok) throw new Error("Failed to fetch metrics");
        const data: SavedMetric[] = await response.json();

        setAllMetrics(data);

        const onDashboardMetrics = data.filter(
          (m) => m.is_on_dashboard && m.dashboard_layout
        );

        const initialLayouts: Layouts = {
          lg: onDashboardMetrics.map((m) => ({
            i: m.id,
            ...(m.dashboard_layout as {
              x: number;
              y: number;
              w: number;
              h: number;
            }),
          })),
        };
        setLiveLayouts(initialLayouts);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  const toggleMetricOnDashboard = (metricId: string) => {
    const currentLgLayout = liveLayouts.lg || [];
    const isOnDashboard = currentLgLayout.some((l) => l.i === metricId);

    if (isOnDashboard) {
      const newLgLayout = currentLgLayout.filter((l) => l.i !== metricId);
      setLiveLayouts({ ...liveLayouts, lg: newLgLayout });
    } else {
      const newLayoutItem: Layout = {
        i: metricId,
        x: 0,
        y: Infinity,
        w: 4,
        h: 2,
      };
      setLiveLayouts({
        ...liveLayouts,
        lg: [...currentLgLayout, newLayoutItem],
      });
    }
  };

  const handleLayoutChange = (newLayout: Layout[], allLayouts: Layouts) => {
    setLiveLayouts(allLayouts);
  };

  const handleSaveLayout = async () => {
    setIsSaving(true);
    const layoutToSave = liveLayouts.lg || [];
    const metricsToUpdate = allMetrics.map((metric) => {
      const layoutItem = layoutToSave.find((l) => l.i === metric.id);
      return {
        id: metric.id,
        is_on_dashboard: !!layoutItem,
        dashboard_layout: layoutItem
          ? {
              x: layoutItem.x,
              y: layoutItem.y,
              w: layoutItem.w,
              h: layoutItem.h,
            }
          : null,
      };
    });

    try {
      const response = await fetch("/api/metrics/layout", {
        method: "PUT",
        body: JSON.stringify(metricsToUpdate),
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to save layout.");
      alert("Layout saved successfully!");
    } catch (error) {
      console.error("Failed to save layout:", error);
      alert("Error: Could not save layout.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleMetricUpdated = (updatedMetric: SavedMetric) => {
    setAllMetrics(
      allMetrics.map((m) => (m.id === updatedMetric.id ? updatedMetric : m))
    );
    setSelectedMetric(updatedMetric);
  };

  const handleMetricDeleted = (metricId: string) => {
    setAllMetrics(allMetrics.filter((m) => m.id !== metricId));
    const newLgLayout = liveLayouts.lg?.filter((l) => l.i !== metricId);
    setLiveLayouts({ ...liveLayouts, lg: newLgLayout });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <aside
        className={`bg-white border-r p-4 flex flex-col transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        {/* --- Sidebar Header --- */}
        <div className="flex items-center justify-between mb-4">
          {!isSidebarCollapsed && (
            <h2 className="text-xl font-bold">Metrics</h2>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          >
            {isSidebarCollapsed ? <ChevronRight /> : <ChevronLeft />}
          </Button>
        </div>

        {/* --- Metrics List --- */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <ul className="space-y-2">
              {/* --- Generate New Metric Button --- */}
              <li>
                <Link
                  href="/newMetric"
                  className="flex items-center p-2 rounded-md bg-purple-100 text-purple-700 font-semibold hover:bg-purple-200"
                >
                  <Plus size={16} className="shrink-0" />
                  {!isSidebarCollapsed && (
                    <span className="ml-2">Generate New</span>
                  )}
                </Link>
              </li>
              {/* --- List of all available metrics --- */}
              {allMetrics.map((metric) => {
                const isOnDashboard = liveLayouts.lg?.some(
                  (l) => l.i === metric.id
                );
                return (
                  <li
                    key={metric.id}
                    // For simplicity, using a standard onClick here, but you can re-integrate the double-click hook
                    onClick={() => toggleMetricOnDashboard(metric.id)}
                    className={`flex items-center p-2 rounded-md cursor-pointer ${
                      isOnDashboard
                        ? "bg-blue-100 text-blue-700"
                        : "hover:bg-gray-100"
                    }`}
                    title={metric.name} // Tooltip is helpful when collapsed
                  >
                    <GripVertical
                      size={16}
                      className="shrink-0 text-gray-400"
                    />
                    {!isSidebarCollapsed && (
                      <span className="flex-1 truncate ml-2">
                        {metric.name}
                      </span>
                    )}
                  </li>
                );
              })}
              <li>
                <Button
                  onClick={handleSaveLayout}
                  disabled={isSaving}
                  className="w-full justify-center p-2 mt-2"
                >
                  <Save size={16} className="shrink-0" />
                  {!isSidebarCollapsed && (
                    <span className="ml-2">
                      {isSaving ? "Saving..." : "Save Layout"}
                    </span>
                  )}
                </Button>
              </li>
            </ul>
          )}
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        {isLoading ? (
          <p>Loading Dashboard...</p>
        ) : (
          <ResponsiveGridLayout
            className="layout"
            layouts={liveLayouts}
            onLayoutChange={handleLayoutChange}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={100}
            isDraggable
            isResizable
          >
            {dashboardMetrics.map((metric) => (
              <div key={metric.id}>
                <DraggableMetricWidget
                  metric={metric}
                  onSingleClick={() => {}}
                  onDoubleClick={() => setSelectedMetric(metric)}
                />
              </div>
            ))}
          </ResponsiveGridLayout>
        )}
      </main>

      <MetricViewModal
        open={!!selectedMetric}
        metric={selectedMetric}
        onOpenChange={(isOpen) => !isOpen && setSelectedMetric(null)}
        onMetricUpdated={handleMetricUpdated}
        onMetricDeleted={handleMetricDeleted}
      />
    </div>
  );
}

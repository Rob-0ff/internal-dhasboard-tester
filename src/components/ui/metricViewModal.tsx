// src/components/MetricViewModal.tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChartRenderer } from "./ChartRenderer";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { SavedMetric } from "@/lib/types";

interface MetricViewModalProps {
  open: boolean;
  metric: SavedMetric | null;
  onOpenChange: (isOpen: boolean) => void;
  onMetricUpdated: (updatedMetric: SavedMetric) => void;
  onMetricDeleted: (metricId: string) => void;
}

export function MetricViewModal({
  open,
  metric,
  onOpenChange,
  onMetricUpdated,
  onMetricDeleted,
}: MetricViewModalProps) {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(metric?.name || "");

  useEffect(() => {
    if (metric) {
      setEditedName(metric.name);
    }
  }, [metric]);

  useEffect(() => {
    const fetchData = async () => {
      if (open && metric) {
        setIsLoading(true);
        setError("");
        setData([]);
        try {
          const response = await fetch("/api/metrics/execute", {
            method: "POST",
            body: JSON.stringify({ sql_query: metric.sql_query }),
            headers: { "Content-Type": "application/json" },
          });

          const result = await response.json();
          if (!response.ok) {
            throw new Error(result.error || "Failed to fetch metric data.");
          }
          setData(result);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchData();
  }, [open, metric]);

  const handleUpdateName = async () => {
    if (!metric || !editedName.trim()) return;
    try {
      const response = await fetch(`/api/metrics/${metric.id}`, {
        method: "PUT",
        body: JSON.stringify({ name: editedName }),
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to update name.");
      const updatedMetric = await response.json();
      onMetricUpdated(updatedMetric);
      setIsEditing(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async () => {
    if (
      !metric ||
      !confirm(`Are you sure you want to delete "${metric.name}"?`)
    )
      return;
    try {
      const response = await fetch(`/api/metrics/${metric.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete metric.");
      onMetricDeleted(metric.id);
      onOpenChange(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setIsEditing(false);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                autoFocus
              />
              <Button onClick={handleUpdateName}>Save</Button>
              <Button variant="ghost" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <DialogTitle className="flex items-center">
              {metric?.name}
              <div className="pl-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="ml-2"
                  onClick={handleDelete}
                >
                  Delete
                </Button>
              </div>
            </DialogTitle>
          )}
          <DialogDescription>
            Displaying the chart for your saved metric.
          </DialogDescription>

          {metric && (
            <div className="pt-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                SQL Query
              </p>
              <code className="text-xs text-muted-foreground font-mono bg-muted p-2 rounded-md block overflow-x-auto w-full">
                {metric.sql_query}
              </code>
            </div>
          )}
        </DialogHeader>
        <div className="h-96 py-4">
          {isLoading && <Skeleton className="h-full w-full" />}
          {error && <p className="text-red-500 text-center">{error}</p>}
          {!isLoading && !error && data.length > 0 && metric && (
            <ChartRenderer suggestion={metric.chart_suggestion} data={data} />
          )}
          {!isLoading && !error && data.length === 0 && (
            <p className="text-center text-gray-500">
              No data found for this query.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

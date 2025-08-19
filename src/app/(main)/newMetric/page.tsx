// src/app/newMetric/page.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ChartRenderer } from "@/components/ui/ChartRenderer"; // Ensure this path is correct for your project
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

// Define types for our state
interface ChartSuggestion {
  type: string;
  title: string;
  props: {
    index: string;
    categories: string[];
    [key: string]: any;
  };
}
type DataRow = Record<string, any>;

export default function NewMetricPage() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // State to hold the API response
  const [sql, setSql] = useState("");
  const [data, setData] = useState<DataRow[]>([]);
  const [chartSuggestions, setChartSuggestions] = useState<ChartSuggestion[]>(
    []
  );
  const [hasSearched, setHasSearched] = useState(false);

  // State for the "Save Metric" dialog
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [newMetricName, setNewMetricName] = useState("");
  const [selectedChartIndex, setSelectedChartIndex] = useState("0");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setHasSearched(true);
    setError("");
    setSql("");
    setData([]);
    setChartSuggestions([]);

    try {
      const response = await fetch("/api/newMetric", {
        method: "POST",
        body: JSON.stringify({ query }),
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "An error occurred.");

      setSql(result.sqlQuery);
      setData(result.data);
      setChartSuggestions(result.chartSuggestions);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveMetric = async () => {
    if (!newMetricName.trim()) {
      alert("Please provide a name for your metric.");
      return;
    }

    const selectedChart = chartSuggestions[parseInt(selectedChartIndex, 10)];
    if (!selectedChart) {
      alert("Invalid chart selection.");
      return;
    }

    try {
      const response = await fetch("/api/metrics", {
        method: "POST",
        body: JSON.stringify({
          name: newMetricName,
          sql_query: sql,
          chart_suggestion: selectedChart,
        }),
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save the metric.");
      }

      alert("Metric saved successfully!");
      setIsSaveDialogOpen(false);
      setNewMetricName("");
    } catch (error: any) {
      alert(error.message);
    }
  };

  // Helper function to render the results or empty/loading states
  const renderResults = () => {
    if (isLoading) {
      return (
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-80 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-1/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        </div>
      );
    }

    if (error) {
      return (
        <p className="text-red-500 bg-red-100 p-4 rounded-md text-center">
          {error}
        </p>
      );
    }

    if (!hasSearched) {
      return (
        <div className="text-center text-gray-500 py-16">
          <BarChart3 size={48} className="mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Ready to Generate Metrics</h3>
          <p>Your generated charts and tables will appear here.</p>
        </div>
      );
    }

    if (data.length === 0 && hasSearched) {
      return (
        <p className="text-center text-gray-500 py-16">
          No results found for your query. Please try a different question.
        </p>
      );
    }

    if (data.length > 0) {
      return (
        <div className="space-y-8">
          {/* Save Button is prominent when results are shown */}
          <div className="text-center">
            <Button onClick={() => setIsSaveDialogOpen(true)}>
              Save as New Metric
            </Button>
          </div>

          {/* Chart Carousel Section */}
          {chartSuggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Suggested Visualizations</CardTitle>
              </CardHeader>
              <CardContent>
                <Carousel className="w-full">
                  <CarouselContent>
                    {chartSuggestions.map((suggestion, index) => (
                      <CarouselItem key={index}>
                        <div className="p-1">
                          <h3 className="text-lg font-semibold mb-4 text-center">
                            {suggestion.title}
                          </h3>
                          <div className="h-80">
                            <ChartRenderer
                              suggestion={suggestion}
                              data={data}
                            />
                          </div>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              </CardContent>
            </Card>
          )}

          {/* Data Table Section */}
          <Card>
            <CardHeader>
              <CardTitle>Raw Data</CardTitle>
              <CardDescription>
                Generated SQL: <code>{sql}</code>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    {Object.keys(data[0]).map((key) => (
                      <TableHead key={key}>{key}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row, index) => (
                    <TableRow key={index}>
                      {Object.values(row).map((value: any, i) => (
                        <TableCell key={i}>{String(value)}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      );
    }

    return null; // Should not be reached, but good practice
  };

  return (
    <div className="container mx-auto p-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Generate a New Metric</CardTitle>
          <CardDescription>
            Ask for data in plain English to generate tables and charts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Show me user signups by country..."
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Generating..." : "Generate"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Render all results, loading, and empty states here */}
      <div className="mt-8">{renderResults()}</div>

      {/* The Save Metric Dialog */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save New Metric</DialogTitle>
            <DialogDescription>
              Give your new metric a name and choose the default visualization.
              This will add it to your main dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="metric-name">Metric Name</Label>
              <Input
                id="metric-name"
                value={newMetricName}
                onChange={(e) => setNewMetricName(e.target.value)}
                placeholder="e.g., Monthly User Signups by Country"
              />
            </div>

            {chartSuggestions.length > 0 && (
              <div className="space-y-2">
                <Label>Choose a Default Chart</Label>
                <RadioGroup
                  value={selectedChartIndex}
                  onValueChange={setSelectedChartIndex}
                >
                  {chartSuggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={String(index)}
                        id={`chart-option-${index}`}
                      />
                      <Label htmlFor={`chart-option-${index}`}>
                        {suggestion.title} ({suggestion.type})
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSaveDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveMetric}>Save Metric</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export interface SavedMetric {
  id: string;
  name: string;
  sql_query: string;
  chart_suggestion: {
    type: string;
    title: string;
    props: {
      index: string;
      categories: string[];
      [key: string]: any;
    };
  };
  created_at: string;
  is_on_dashboard: boolean;
  dashboard_layout?: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}
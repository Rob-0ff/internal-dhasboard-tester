// src/app/api/chat/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from '@/lib/supabaseClient'; // Adjust path if needed
import fs from 'fs/promises';
import path from 'path';
import { NextRequest, NextResponse } from "next/server";

// --- PROMPT ENGINEERING ---

// Persona 1: The SQL Expert (Mostly unchanged)
const textToSqlSystemPrompt = `
You are a PostgreSQL expert who translates natural language questions into SQL queries.
- Your ONLY output must be a single, valid JSON object with one key 'sqlQuery'.
- Do not include any conversational text, explanation, or introductory phrases.
- Crucially, do not wrap the JSON object in markdown formatting. Return only the raw JSON string starting with { and ending with }.
- The sqlQuery value must be a safe, read-only SELECT statement compatible with a Supabase RPC function (no trailing ';').
- If the request is invalid or cannot be answered with a SELECT query, return {"sqlQuery": null}.
- Generate appropriate user-friendly, names for columns and tables based on the schema.
`;

// Persona 2: The Data Visualization Expert (NEW)
const dataToChartSystemPrompt = `
You are a data visualization expert specializing in the Tremor library.
Your task is to analyze a user's question and the resulting JSON data from a database.
- Your ONLY output must be a single, valid JSON object with one key: "chartSuggestions".
- Do not include any conversational text, explanation, or introductory phrases.
- Crucially, do not wrap the JSON object in markdown formatting. Return only the raw JSON string starting with { and ending with }.
- The value must be an ARRAY of suggested chart objects.
- Each object in the array must have three keys: "type" (the Tremor chart component name, e.g., "BarChart", "LineChart", "DonutChart", "AreaChart"), "title" (a descriptive title for the chart), and "props" (an object with the specific props for that Tremor component, like "index" and "categories").
- "index" should be the column name for the main category or x-axis (e.g., date, country).
- "categories" must be an array of column names for the values or y-axis (e.g., ["user_count"], ["Sales"]).
- Suggest only more than one chart if the data supports multiple visualizations.
- If no chart is suitable, return {"chartSuggestions": []}.
- Your options for chart types are: "BarChart", "LineChart", "DonutChart", "AreaChart".
`;

async function getSchema() {
  const schemaPath = path.join(process.cwd(), 'src', 'app', 'api', 'tools', 'schema.txt');
  return await fs.readFile(schemaPath, 'utf-8');
}

function extractJson(text: string): string | null {
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
}


export async function POST(req: NextRequest) {
  const { query } = await req.json();

  if (!query) {
    return new NextResponse(JSON.stringify({ error: "Query is required." }), { status: 400 });
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  
  try {
    // --- STEP 1: TEXT-TO-SQL ---
    const dbSchema = await getSchema();
    const sqlModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite", // Use 1.5-flash for better reasoning
      systemInstruction: textToSqlSystemPrompt + `\nSchema:\n${dbSchema}`,
    });

    const sqlResult = await sqlModel.generateContent(query);

    const sqlJson = extractJson(sqlResult.response.text());

    let { sqlQuery } = JSON.parse(sqlJson || '{ "sqlQuery": null }');

    console.log("Generated SQL Query:", sqlQuery);

    if (sqlQuery && sqlQuery.endsWith(';')) {
      sqlQuery = sqlQuery.slice(0, -1);
    }

    if (!sqlQuery) {
      return new NextResponse(JSON.stringify({ error: "Sorry, I can only process data queries." }), { status: 400 });
    }

    // --- STEP 2: EXECUTE SQL QUERY ---
    const { data, error } = await supabase.rpc("execute_sql", { sql_query: sqlQuery });

    if (error) throw new Error(`Database error: ${error.message}`);
    if (!data || data.length === 0) {
      return new NextResponse(JSON.stringify({ sqlQuery, data: [], chartSuggestions: [] }), { status: 200 });
    }

    // --- STEP 3: DATA-TO-CHART ---
    const chartModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      systemInstruction: dataToChartSystemPrompt,
    });

    const chartPrompt = `User's Question: "${query}"\n\nDatabase Result (JSON):\n${JSON.stringify(data, null, 2)}`;
    const chartResult = await chartModel.generateContent(chartPrompt);

    const chartJson = extractJson(chartResult.response.text());

    const { chartSuggestions } = JSON.parse(chartJson || '{ "chartSuggestions": [] }');

    console.log("Generated Chart Suggestions:", chartSuggestions);

    // --- STEP 4: COMBINE AND RETURN ---
    return new NextResponse(JSON.stringify({ sqlQuery, data, chartSuggestions }), { status: 200 });

  } catch (error: any) {
    console.error("API Error:", error);
    return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
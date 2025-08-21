import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from '@/lib/supabaseClient';
import fs from 'fs/promises';
import path from 'path';
import { NextRequest, NextResponse } from "next/server";

// --- PROMPT ENGINEERING ---

// Persona 1: The SQL Expert (Mostly unchanged)
// src/app/api/chat/route.ts -> Persona 1 Prompt

const textToSqlSystemPrompt = `
You are a PostgreSQL expert who translates natural language questions into SQL queries.
- Your ONLY output must be a single, valid JSON object with one key: "sqlQuery".
- Do not include any conversational text or markdown formatting. Return only the raw JSON string.
- The value must be a safe, read-only SELECT statement.
- **Crucially, you MUST use SQL aliases (AS "User Friendly Name") to create readable, user-friendly column names.** For example, instead of 'count(*)', use 'AS "Number of Users"'. Instead of 'created_at', use 'AS "Signup Date"'.
- If a date or timestamp is being selected, format it as a clean string like 'YYYY-MM-DD' using TO_CHAR. For example: TO_CHAR(created_at, 'YYYY-MM-DD') AS "Date". This is critical for time-series charts.
- If the request is invalid, return {"sqlQuery": null}.
`;

// Persona 2: The Data Visualization Expert (NEW)
const dataToChartSystemPrompt = `
You are a data visualization expert specializing in the Tremor library. Your task is to analyze a user's question and the resulting JSON data to suggest the best visualizations.
- Your ONLY output must be a single, valid JSON object with one key: "chartSuggestions".
- Do not include any conversational text or markdown formatting. Return only the raw JSON string.
- The value must be an ARRAY of suggested chart objects.
- Each chart object must have "type", "title", and "props" keys.
- **The "props" object MUST include a "colors" array.** The colors must be chosen from this list of valid Tremor color names: ['slate', 'gray', 'zinc', 'neutral', 'stone', 'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose']. Choose colors that match the number of categories.
- For "BarChart", "LineChart", and "AreaChart", the "props" must include an "index" (the x-axis, typically a date or label) and "categories" (an array of numeric column names for the y-axis).
- **For "DonutChart", the "props" are different:** it must have an "index" (the slice labels) and a "category" (the single numeric column name for the values). This is critical.
- If the data is unsuitable for any chart, return {"chartSuggestions": []}.
- Your available chart "type" options are: "BarChart", "AreaChart", "DonutChart".
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
      model: "gemini-2.5-flash-lite", 
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
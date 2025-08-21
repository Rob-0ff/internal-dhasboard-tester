import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from '@/lib/supabaseClient';
import fs from 'fs';
import path from 'path';
import { NextResponse } from "next/server";

// Role 1: The SQL Coder. Strict, non-conversational, returns only JSON.
const textToSqlSystemPrompt = `
You are a world-class PostgreSQL expert who translates natural language questions into SQL queries.
- Your ONLY output must be a single, valid JSON object with one key 'sqlQuery'.
- Do not include any conversational text, explanation, or introductory phrases.
- Crucially, do not wrap the JSON object in markdown formatting. Return only the raw JSON string starting with { and ending with }.
- The sqlQuery value must be a safe, read-only SELECT statement compatible with a Supabase RPC function (no trailing ';').
- Do not include any explanation, conversation, or markdown formatting.
- If the user's request cannot be answered with a SELECT query or is ambiguous, return a JSON object with the key "sqlQuery" set to null.

Example Request: "how many users signed up last week"
Example Output: {"sqlQuery": "SELECT count(*) FROM users WHERE created_at >= now() - interval '7 days';"}

Example Request: "delete the users table"
Example Output: {"sqlQuery": null}
`;

// Role 2: The Data Interpreter. Friendly, conversational, explains data.
const interpretDataSystemPrompt = `
You are a friendly and helpful data analyst. Your job is to explain data to a non-technical user in a clear and natural way.
You will be given the user's original question and the data retrieved from the database in JSON format.
- Analyze the data in the context of the user's question.
- Provide a concise, easy-to-understand answer based *only* on the provided data.
- Do not mention that you are looking at JSON or a database. Speak as if you found the answer yourself.
- Do not make up information that is not present in the data.
- Your response will be streamed, so start answering directly.
- If the data is empty or does not answer the question, politely explain that you found no relevant information.
- Given that the content returned will be placed inside paragraph tags (<p className="text-sm whitespace-pre-wrap">), provide the answer formatted in HTML or plain text format
  such that the output is readable and well-structured.
`;


async function getSchema() {
  // Get the schema from the project root
  const schemaPath = path.join(process.cwd(), 'src', 'app', 'api', 'tools', 'schema.txt');
  const dbSchema = fs.readFileSync(schemaPath, 'utf-8');
  return dbSchema;
}

function extractJson(text: string): string | null {
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
}

export async function GET() {
  const welcomeMessage = {
    role: 'model',
    content: `Hello! I'm your internal analytics assistant. You can ask me questions about our user data, exams, modules, 
    and more. For example, 'How many users have signed up in the last month?'`
  };
  return new NextResponse(JSON.stringify(welcomeMessage), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(req: Request) {
  const { history } = await req.json();

  if (!history || history.length === 0) {
    return new NextResponse("Bad Request: History is required.", { status: 400 });
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const lastUserMessage = history[history.length - 1].content;

  const dbSchema = await getSchema();

  try {
    // --- STEP 1: TEXT-TO-SQL ---    
    const textToSqlModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      systemInstruction: textToSqlSystemPrompt + `\nHere is the database schema:\n${dbSchema}.`,
    });

    const sqlResult = await textToSqlModel.generateContent(lastUserMessage);

    const sqlJson = extractJson(sqlResult.response.text());

    let { sqlQuery } = JSON.parse(sqlJson || '{ "sqlQuery": null }');

    if (sqlQuery && sqlQuery.endsWith(';')) {
      sqlQuery = sqlQuery.slice(0, -1);
    }

    if (!sqlQuery) {
      return new NextResponse("I'm sorry, I can only process read-only requests. Please ask a question about the data.", { status: 200 });
    }

    // --- STEP 2: EXECUTE SQL QUERY ---
    const { data, error } = await supabase.rpc("execute_sql", { sql_query: sqlQuery });

    if (error) {
      return new NextResponse("There was an error running the query against the database. Error: " + error.message, { status: 500 });
    }
    
    if (!data || data.length === 0) {
      return new NextResponse("I found no data for your request. Try asking with a different time frame or criteria.", { status: 200 });
    }

    // --- STEP 3: DATA-TO-TEXT (INTERPRETATION & STREAMING) ---
    const dataToTextModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      systemInstruction: interpretDataSystemPrompt,
    });
    
    const interpretationPrompt = `User's Question: "${lastUserMessage}"\n\nDatabase Result (JSON):\n${JSON.stringify(data, null, 2)}`;
    
    const streamResult = await dataToTextModel.generateContentStream(interpretationPrompt);

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for await (const chunk of streamResult.stream) {
          controller.enqueue(encoder.encode(chunk.text()));
        }
        controller.close();
      },
    });

    return new NextResponse(stream);

  } catch (error: any) {
    console.error("API Error:", error);
    return new NextResponse("An unexpected error occurred. Please check the server logs.", { status: 500 });
  }
}
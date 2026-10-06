import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

export type Label = "Positive" | "Negative" | "Neutral";
export interface Classification {
  label: Label;
  confidence: number;
  explanation: string;
}

async function callGateway(body: unknown) {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI service is not configured (missing LOVABLE_API_KEY).");
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.status === 429) throw new Error("Rate limit reached. Please wait a moment and try again.");
  if (res.status === 402) throw new Error("AI credits exhausted. Add credits in workspace settings.");
  if (!res.ok) throw new Error(`AI model request failed (${res.status}).`);
  return res.json();
}

export const classifyTexts = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ texts: z.array(z.string().min(1).max(4000)).min(1).max(30) }).parse(d),
  )
  .handler(async ({ data }): Promise<Classification[]> => {
    const numbered = data.texts.map((t, i) => `[${i}] ${t}`).join("\n");
    const json = await callGateway({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a sentiment classification model. For each numbered text, classify overall sentiment as Positive, Negative or Neutral. Consider negation, sarcasm, context and mixed statements. Give a calibrated confidence between 0 and 1 and a one-sentence explanation citing the cues in the text.",
        },
        { role: "user", content: numbered },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "report_sentiments",
            description: "Return one classification per input text, in order.",
            parameters: {
              type: "object",
              properties: {
                results: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      index: { type: "integer" },
                      label: { type: "string", enum: ["Positive", "Negative", "Neutral"] },
                      confidence: { type: "number" },
                      explanation: { type: "string" },
                    },
                    required: ["index", "label", "confidence", "explanation"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["results"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "report_sentiments" } },
    });
    const args = json?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("Model returned no classification.");
    const parsed = JSON.parse(args) as { results: Array<Classification & { index: number }> };
    return data.texts.map((_, i) => {
      const r = parsed.results.find((x) => x.index === i);
      if (!r) throw new Error("Model response was incomplete. Please retry.");
      return {
        label: r.label,
        confidence: Math.max(0, Math.min(1, Number(r.confidence) || 0)),
        explanation: r.explanation,
      };
    });
  });

export const generateInsights = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        summary: z.string().max(20000),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const json = await callGateway({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a data analyst. Using ONLY the statistics and samples provided, write 4-6 concise bullet-point insights (markdown '- ' bullets, no headings): overall mood, main problem areas in negative feedback, main strengths in positive feedback, and trends over time if provided. Never invent numbers or facts not supported by the data. If data is too small to conclude, say so.",
        },
        { role: "user", content: data.summary },
      ],
    });
    const text = json?.choices?.[0]?.message?.content;
    if (!text) throw new Error("Model returned no insights.");
    return { text: String(text) };
  });

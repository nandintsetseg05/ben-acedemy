import { Router, type IRouter } from "express";
import { db, submissionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";
import { rateLimit } from "express-rate-limit";
import OpenAI from "openai";

const router: IRouter = Router();

const benRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: "Too many grading requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

function detectSuspiciousContent(text: string): boolean {
  if (text.length < 50) return false;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  if (sentences.length < 2) return false;

  const duplicateThreshold = 0.3;
  const seen = new Set<string>();
  let duplicates = 0;

  for (const sentence of sentences) {
    const normalized = sentence.trim().toLowerCase().replace(/\s+/g, " ");
    if (seen.has(normalized)) {
      duplicates++;
    }
    seen.add(normalized);
  }

  const ratio = duplicates / sentences.length;
  return ratio > duplicateThreshold;
}

router.post("/grade", requireAuth, benRateLimit, async (req: AuthRequest, res) => {
  const { submissionId, essayText, currentBand, targetBand } = req.body;

  if (!submissionId || !essayText) {
    res.status(400).json({ error: "submissionId and essayText are required" });
    return;
  }

  const [submission] = await db
    .select()
    .from(submissionsTable)
    .where(and(eq(submissionsTable.id, submissionId), eq(submissionsTable.userId, req.userId!)))
    .limit(1);

  if (!submission) {
    res.status(404).json({ error: "Submission not found" });
    return;
  }

  const flagged = detectSuspiciousContent(essayText);
  if (flagged) {
    await db.update(submissionsTable)
      .set({ flaggedForReview: true })
      .where(eq(submissionsTable.id, submissionId));

    res.json({
      bandScore: 0,
      flagged: true,
      detailedFeedback: {
        taskAchievement: "Your submission has been flagged for review.",
        coherenceCohesion: "Please ensure your work is original.",
        lexicalResource: "Suspicious content detected.",
        grammaticalRange: "Please contact support if you believe this is an error.",
      },
      suggestedTasks: [],
      overallSummary: "Your submission has been flagged for review due to suspicious content patterns.",
    });
    return;
  }

  const openai = new OpenAI({
    baseURL: process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"],
    apiKey: process.env["AI_INTEGRATIONS_OPENAI_API_KEY"],
  });

  const systemPrompt = `You are an expert IELTS examiner with years of experience grading IELTS Writing Task 2 essays. 
You must evaluate essays on the official IELTS 4 criteria:
1. Task Achievement (does the essay answer the question fully?)
2. Coherence and Cohesion (is it well-organized with good linking?)
3. Lexical Resource (variety and accuracy of vocabulary)
4. Grammatical Range and Accuracy (variety and accuracy of grammar)

Return ONLY valid JSON with no markdown, no code blocks, just the raw JSON object.`;

  const userPrompt = `Grade this IELTS Writing Task 2 essay:

ESSAY:
${essayText}

${currentBand ? `Student's current band: ${currentBand}` : ""}
${targetBand ? `Student's target band: ${targetBand}` : ""}

Respond with ONLY this JSON structure (no markdown, no code blocks):
{
  "bandScore": <number 0-9, can be 0.5 increments>,
  "detailedFeedback": {
    "taskAchievement": "<detailed feedback>",
    "coherenceCohesion": "<detailed feedback>",
    "lexicalResource": "<detailed feedback>",
    "grammaticalRange": "<detailed feedback>"
  },
  "suggestedTasks": [
    { "title": "<task title>", "description": "<what to practice>" }
  ],
  "overallSummary": "<2-3 sentence overall summary and encouragement>"
}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 8192,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const content = completion.choices[0]?.message?.content ?? "{}";

  let result;
  try {
    result = JSON.parse(content);
  } catch {
    result = {
      bandScore: 0,
      detailedFeedback: {
        taskAchievement: "Unable to parse AI response",
        coherenceCohesion: "",
        lexicalResource: "",
        grammaticalRange: "",
      },
      suggestedTasks: [],
      overallSummary: content,
    };
  }

  await db.update(submissionsTable)
    .set({
      score: result.bandScore,
      aiFeedback: content,
    })
    .where(eq(submissionsTable.id, submissionId));

  res.json({ ...result, flagged: false });
});

export default router;

import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  app.get("/api/health", (req, res) => res.json({ status: "ok" }));

  // API Route for Generating Quiz
  app.post("/api/quiz", async (req, res) => {
    try {
      const { text, file, userApiKey, difficulty = "Intermediate", questionCount = 10, mode = "text" } = req.body;

      // Prioritize client-provided key, fall back to environment key
      const apiKey = userApiKey || process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(400).json({
          error: "Gemini API key is required. Please configure it in the Setup screen or use the environment secret."
        });
      }

      if (mode !== "file" && (!text || text.trim().length === 0)) {
        const errorMsg = mode === "topic" 
          ? "Please enter a topic to build a quiz (e.g., Photosynthesis)." 
          : "Please enter grammar text/notes to build a quiz.";
        return res.status(400).json({ error: errorMsg });
      }

      if (mode === "file" && (!file || !file.data)) {
        return res.status(400).json({ error: "Please upload a picture or document to build a quiz." });
      }

      // Constrain question count to reasonable limits (between 3 and 25 questions)
      const count = Math.min(Math.max(Number(questionCount) || 10, 3), 25);

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      let prompt = "";
      let systemInstruction = "";

      if (mode === "topic") {
        prompt = `Generate a ${count}-question multiple-choice quiz about the following topic: "${text}".
The target difficulty level of the quiz MUST be: ${difficulty}.
Guidelines per difficulty level:
- Beginner: Use basic terminology, fundamental facts, and clear, obvious distractors. Focus on primary concepts.
- Intermediate: Use standard terminology, requiring a solid conceptual understanding. Use plausible distractors testing common misconceptions.
- Advanced: Use complex, in-depth technical or scientific vocabulary. Test advanced concepts, nuance, edge-cases, and sophisticated insights with highly plausible distractors.

Ensure each question has exactly 4 options and 1 unambiguous correct answer. Include a detailed, clear explanation for each question explaining why the correct answer is correct, and why other options are incorrect.`;

        systemInstruction = `You are an expert educator and Quiz Wizard. Your goal is to generate high-quality, strictly unambiguous multiple-choice questions (MCQs) in valid JSON format about the topic: "${text}". Ensure exactly 4 options are provided per question. Generate exactly ${count} questions. Align the complexity with the requested difficulty: ${difficulty}.`;
      } else if (mode === "file") {
        prompt = `Analyze the uploaded picture or document. Generate a ${count}-question multiple-choice quiz based strictly on the factual information, rules, language structure, grammar concepts, or content contained within the file.
The target difficulty level of the quiz MUST be: ${difficulty}.
Guidelines per difficulty level:
- Beginner: Use simple vocabulary, straightforward sentences, and clear distractors. Focus on key primary facts/rules from the file.
- Intermediate: Use standard terminology and requiring general comprehension of the text. Use plausible distractors testing common misconceptions or errors.
- Advanced: Test subtle nuances, complex details, exceptions, or advanced grammar/facts from the file with highly plausible distractors.

Ensure each question has exactly 4 options and 1 unambiguous correct answer. Include a detailed, clear explanation for each question explaining why the correct answer is correct, and why other options are incorrect.`;

        systemInstruction = `You are an expert educator and Quiz Wizard. Your goal is to analyze the uploaded picture or document and generate high-quality, strictly unambiguous multiple-choice questions (MCQs) in valid JSON format according to the schema. Ensure exactly 4 options are provided per question. Generate exactly ${count} questions. Align the complexity with the requested difficulty: ${difficulty}.`;
      } else if (mode === "practice_incorrect") {
        let incorrectDetails = "";
        try {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            incorrectDetails = parsed.map((item: any, idx: number) => {
              return `Incorrect Question ${idx + 1}: "${item.question}"
- Correct answer was: "${item.correct_answer_text}"
- The option the user chose: "${item.user_answer_text}"`;
            }).join("\n\n");
          } else {
            incorrectDetails = text;
          }
        } catch (e) {
          incorrectDetails = text;
        }

        prompt = `You are a professional English Grammar teacher and custom quiz designer.
A student took a grammar quiz and got some questions wrong. Below are the details of the questions they answered INCORRECTLY, along with the correct answers and the incorrect options they chose:

${incorrectDetails}

Generate a personalized review and practice quiz with exactly ${count} multiple-choice questions (MCQs).
These new questions MUST specifically target and clarify the exact concepts, rules, and common mistakes/microconceptions associated with the errors the student made. Each new question must help reinforce their understanding and address their weakness.

Ensure each question has exactly 4 options and 1 unambiguous correct answer. Include a detailed, clear explanation for each question.`;

        systemInstruction = `You are a professional English Grammar tutor. Your goal is to analyze the student's mistakes and generate a customized review quiz with exactly ${count} MCQs targeting those specific grammar rules and common misconceptions. Ensure exactly 4 options are provided per question. Output must be in valid JSON format matching the schema.`;
      } else {
        prompt = `Analyze the provided text. Generate a ${count}-question English Grammar MCQ quiz based solely on the active rules (such as tense formation, auxiliary verbs, or sentence structure) found in the text. 

The target difficulty level of the quiz MUST be: ${difficulty}.
Guidelines per difficulty level:
- Beginner: Use very simple vocabulary, straightforward and short sentences, and clear, obvious distractors. Focus on direct and simple applications of the rules.
- Intermediate: Use moderately complex sentences and standard vocabulary. Require a sound understanding of the rule and use plausible distractors that test common errors.
- Advanced: Use complex, sophisticated, and academic sentences with advanced vocabulary and nuanced context. Test edge cases, subtle distinctions, or exceptions of the rule with highly plausible distractors.

Ensure each question has exactly 4 options and 1 unambiguous correct answer.

Text to analyze:
${text}`;

        systemInstruction = `You are a professional English Grammar teacher and Quiz Wizard. Your goal is to analyze grammar texts and generate high-quality, strictly unambiguous multiple-choice questions (MCQs) in valid JSON format according to the schema. Ensure exactly 4 options are provided per question. Generate exactly ${count} questions. Align the complexity of questions with the requested difficulty level: ${difficulty}.`;
      }

      const config = {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: {
                type: Type.STRING,
                description: "The MCQ question text."
              },
              options: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING
                },
                description: "Four separate options. Exactly 4 options must be supplied."
              },
              correct_answer: {
                type: Type.INTEGER,
                description: "The 0-based index (0 to 3) representing the correct option."
              },
              explanation: {
                type: Type.STRING,
                description: "Detailed, high-quality reasoning explaining why the correct option is correct, and why other options are incorrect."
              }
            },
            required: ["question", "options", "correct_answer", "explanation"]
          }
        }
      };

      let contentsToUse: any = prompt;
      if (mode === "file" && file) {
        contentsToUse = {
          parts: [
            {
              inlineData: {
                mimeType: file.mimeType,
                data: file.data
              }
            },
            {
              text: prompt
            }
          ]
        };
      }

      let response;
      const modelsToTry = [
        "gemini-3.5-flash",
        "gemini-flash-latest",
        "gemini-3.1-flash-lite"
      ];

      let lastError: any = null;
      for (const model of modelsToTry) {
        let success = false;
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            console.log(`Attempting to generate quiz with ${model} (attempt ${attempt}/3)...`);
            response = await ai.models.generateContent({
              model: model,
              contents: contentsToUse,
              config: config
            });
            if (response && response.text) {
              console.log(`Successfully generated quiz with ${model}!`);
              success = true;
              break;
            }
          } catch (err: any) {
            lastError = err;
            const errMsg = err?.message || String(err);
            console.log(`Model ${model} attempt ${attempt} returned status: ${errMsg}`);
            if (attempt < 3) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
          }
        }
        if (success) {
          break;
        }
      }

      if (!response) {
        const errMsg = lastError?.message || lastError || "Unknown API error";
        throw new Error(`Quiz Generation failed: All available models (${modelsToTry.join(", ")}) are experiencing high demand or are currently unavailable. Detail: ${errMsg}`);
      }

      const responseText = response.text;
      if (!responseText) {
        throw new Error("No text response received from Gemini.");
      }

      const quizData = JSON.parse(responseText.trim());
      return res.json({ quiz: quizData });

    } catch (error: any) {
      console.error("Quiz Generation Error:", error);
      return res.status(500).json({
        error: error.message || "An unexpected error occurred while generating the quiz."
      });
    }
  });

  // API Route for explaining an MCQ question
  app.post("/api/explain", async (req, res) => {
    try {
      const { question, options, correct_answer, userApiKey } = req.body;
      const apiKey = userApiKey || process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(400).json({
          error: "Gemini API key is required. Please set up your API Key."
        });
      }

      if (!question) {
        return res.status(400).json({ error: "Question text is required." });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const prompt = `You are an expert educator and Quiz Wizard. Explain why the correct option is the right answer and why the other choices are incorrect for the following MCQ:

Question: ${question}
Options:
${options ? options.map((opt: string, i: number) => `${i === 0 ? 'A' : i === 1 ? 'B' : i === 2 ? 'C' : 'D'}. ${opt}`).join("\n") : ""}
Correct Option Index: ${correct_answer} (which matches option: "${options ? options[correct_answer] : ''}")

Provide a concise, clear, and encouraging explanation suitable for a student. Keep it formatting-clean and direct (max 4-5 sentences).`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      const explanation = response.text || "Could not generate an explanation.";
      return res.json({ explanation });
    } catch (error: any) {
      console.error("Explanation Generation Error:", error);
      return res.status(500).json({
        error: error.message || "An unexpected error occurred while explaining."
      });
    }
  });

  // Detect production mode robustly
  const isProd = process.env.NODE_ENV === "production" || 
                 (typeof __filename !== "undefined" && !__filename.endsWith("server.ts")) ||
                 (typeof __dirname !== "undefined" && (__dirname.includes("dist") || path.basename(__dirname) === "dist"));

  // Vite middleware for dev mode or static files for prod mode
  if (!isProd) {
    console.log("Starting server in DEVELOPMENT mode with Vite middleware...");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Determine the absolute path to the static build files
    let distPath = path.join(process.cwd(), "dist");
    if (typeof __dirname !== "undefined") {
      if (__dirname.endsWith("dist") || __dirname.endsWith("dist/") || path.basename(__dirname) === "dist") {
        distPath = __dirname;
      } else {
        distPath = path.join(__dirname, "dist");
      }
    }
    console.log(`[Prod] __dirname is: ${typeof __dirname !== "undefined" ? __dirname : "undefined"}`);
    console.log(`Starting server in PRODUCTION mode. Serving static files from: ${distPath}`);
    
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

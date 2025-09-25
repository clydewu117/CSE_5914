import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";
import * as dotenv from "dotenv";

dotenv.config({ path: '.env.local' });

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash",
  temperature: 0
});

const joke = z.object({
  setup: z.string().describe("The setup of the joke"),
  punchline: z.string().describe("The punchline to the joke"),
  rating: z.number().optional().describe("How funny the joke is, from 1 to 10"),
});

async function run() {
  try {
    const structuredLlm = model.withStructuredOutput(joke);
    const response = await structuredLlm.invoke("Tell me a joke about cats");
    console.log(response);
  } catch (error) {
    console.error("Error invoking the model:", error);
  }
}

run();
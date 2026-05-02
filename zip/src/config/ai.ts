import { ChatGroq } from "@langchain/groq";
export const model = new ChatGroq({
  model: "llama3-70b-8192",
  temperature: 0.7,
  apiKey: process.env["GROQ_API_KEY"] as string,
});

import dotenv from "dotenv";
import { askOllama } from "./ollama.js";

dotenv.config();

const question = "Explique en deux phrases ce qu'est HBntory.";

try {
  const answer = await askOllama(question);
  console.log("\nRéponse de Qwen :\n", answer);
} catch (error) {
  console.error("Échec du test :", error);
}

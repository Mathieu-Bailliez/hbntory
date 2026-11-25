
import { connectMcp, listMcpTools, callMcpTool } from "./mcp.js";

const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL || "http://localhost:11434";

const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen3:4b";

const MAX_TOOL_ROUNDS = 5;

const SYSTEM_PROMPT = `
Tu es l'assistant intelligent de HBntory, une application de gestion
de produits et de stocks.

Tu réponds exclusivement en français.

Tu aides les visiteurs à obtenir des informations sur les produits
et les stocks des différentes agences.

RÈGLES IMPORTANTES :
- Utilise les outils MCP pour obtenir les données réelles.
- Choisis l'outil adapté à la question.
- N'invente jamais de produits, prix, identifiants ou quantités.
- Base tes réponses sur les résultats réellement fournis par les outils.
- Si une information est indisponible, indique-le clairement.
- Si aucun outil ne permet de répondre, explique cette limite.
- Réponds de manière claire, concise et professionnelle.
- Ne révèle jamais ton raisonnement interne.
- Ne conserve pas l'historique des conversations.
`;

type ChatMessage = {
  role: string;
  content: string;
  tool_calls?: unknown[];
  tool_name?: string;
};

type OllamaToolCall = {
  function: {
    name: string;
    arguments: Record<string, unknown>;
  };
};

function extractFinalAnswer(content: string): string {
  let answer = content;

  if (answer.includes("</think>")) {
    answer = answer.split("</think>").pop() ?? "";
  } else if (answer.includes("<think>")) {
    throw new Error("La réponse finale de l'IA est incomplète.");
  }

  return answer.trim();
}

export async function askOllama(question: string): Promise<string> {
  try {
    await connectMcp();

    const mcpTools = await listMcpTools();

    const tools = mcpTools.map((tool) => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description ?? "",
        parameters: tool.inputSchema,
      },
    }));

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: question,
      },
    ];

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          messages,
          tools,
          stream: false,
          think: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur Ollama : HTTP ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage = data.message;

      if (!assistantMessage) {
        throw new Error("Réponse Ollama invalide.");
      }

      const toolCalls = assistantMessage.tool_calls as
        | OllamaToolCall[]
        | undefined;

      if (!toolCalls || toolCalls.length === 0) {
        const content = assistantMessage.content;

        if (typeof content !== "string" || !content.trim()) {
          throw new Error("Ollama a retourné une réponse vide.");
        }

        const finalAnswer = extractFinalAnswer(content);

        if (!finalAnswer) {
          throw new Error("La réponse finale de l'IA est vide.");
        }

        return finalAnswer;
      }

      messages.push({
        role: "assistant",
        content: assistantMessage.content ?? "",
        tool_calls: toolCalls,
      });

      for (const toolCall of toolCalls) {
        const toolName = toolCall.function.name;
        const toolArguments = toolCall.function.arguments ?? {};

        console.log(`Appel de l'outil MCP : ${toolName}`);

        const result = await callMcpTool(toolName, toolArguments);

        const toolContent = result.content
          .map((item) => {
            if (item.type === "text") {
              return item.text;
            }

            return JSON.stringify(item);
          })
          .join("\n");

        messages.push({
          role: "tool",
          tool_name: toolName,
          content: result.isError
            ? `Erreur lors de l'appel MCP : ${toolContent}`
            : toolContent,
        });
      }
    }

    throw new Error("Nombre maximal d'appels aux outils atteint.");
  } catch (error) {
    console.error("Erreur lors de la communication avec Ollama et MCP :", error);
    throw new Error("Impossible de traiter la question avec les services IA.");
  }
}

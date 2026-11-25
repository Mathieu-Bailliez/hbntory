
import express, { Request, Response } from "express";
import "dotenv/config";

import { askOllama } from "./ollama.js";

const app = express();

const PORT = Number(process.env.PORT) || 3001;

app.use(express.json());

// Vérification du service IA
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    service: "HBntory AI Service",
  });
});

// Réception des questions
app.post("/api/query", async (req: Request, res: Response) => {
  try {
    const { question } = req.body;

    if (
      typeof question !== "string" ||
      question.trim().length === 0
    ) {
      res.status(400).json({
        status: "error",
        message: "Une question valide est obligatoire.",
      });
      return;
    }

    const answer = await askOllama(question.trim());

    res.status(200).json({
      status: "success",
      question: question.trim(),
      answer,
    });
  } catch (error) {
    console.error("Erreur du service IA :", error);

    res.status(503).json({
      status: "error",
      message: "Impossible de traiter la question avec le service IA.",
    });
  }
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`HBntory AI Service démarré sur le port ${PORT}`);
});

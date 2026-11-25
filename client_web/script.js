const API_URL = "http://localhost:3001/api/query";

const form = document.getElementById("question-form");
const questionInput = document.getElementById("question");
const submitButton = document.getElementById("submit-button");
const buttonText = document.getElementById("button-text");

const loading = document.getElementById("loading");
const errorMessage = document.getElementById("error-message");
const answerSection = document.getElementById("answer-section");
const answerContent = document.getElementById("answer-content");

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove("hidden");
}

function hideMessages() {
    errorMessage.classList.add("hidden");
    answerSection.classList.add("hidden");
}

async function sendQuestion(question) {
    hideMessages();

    loading.classList.remove("hidden");
    submitButton.disabled = true;
    buttonText.textContent = "Envoi en cours...";

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ question })
        });

        const data = await response.json();

        if (!response.ok || data.status !== "success") {
            throw new Error(
                data.message || "Une erreur est survenue."
            );
        }

        answerContent.textContent = data.answer;
        answerSection.classList.remove("hidden");

    } catch (error) {
        console.error("Erreur Client Web :", error);

        showError(
            error.message.includes("Failed to fetch")
                ? "Impossible de contacter le service IA. Vérifiez qu'il est bien démarré."
                : error.message
        );

    } finally {
        loading.classList.add("hidden");
        submitButton.disabled = false;
        buttonText.textContent = "Envoyer ma question";
    }
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const question = questionInput.value.trim();

    if (!question) {
        showError("Veuillez saisir une question.");
        return;
    }

    await sendQuestion(question);
});

document.querySelectorAll(".suggestion").forEach((button) => {
    button.addEventListener("click", () => {
        const question = button.dataset.question;

        questionInput.value = question;
        sendQuestion(question);
    });
});

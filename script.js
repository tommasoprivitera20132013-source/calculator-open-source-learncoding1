// The full code is intentionally small and commented so it can be used
// as a beginner-friendly starting point for other projects.

const display = document.querySelector("#display");
const languageButtons = document.querySelectorAll("[data-language-button]");
const buttons = document.querySelectorAll("[data-value], [data-action]");

// The calculator stores the current expression as text.
// Example: "12+5*3"
const state = {
  expression: "0",
  language: "en",
};

// All visible texts live in one object so adding another language is easy.
const translations = {
  en: {
    eyebrow: "Open-source starter project",
    title: "Calculator with code explanations",
    intro: "This small app is built to be easy to read, remix, and publish on GitHub.",
    screenLabel: "Expression",
    howToOpenTitle: "How to open it",
    openStepOne: "Download or clone the repository from GitHub.",
    openStepTwo: "Open the folder and double-click index.html.",
    openStepThree: "If you want a website link, enable GitHub Pages in the repository settings.",
    codeGuideTitle: "How the code is organized",
    codeGuideOne: "index.html contains the page structure and the calculator buttons.",
    codeGuideTwo: "styles.css controls colors, layout, and responsive design.",
    codeGuideThree: "script.js handles calculator logic and the language switcher.",
    tipTitle: "Starter tip",
    tipText: "Change one small part at a time. For example: add a square root button, change the colors, or support more languages.",
  },
  it: {
    eyebrow: "Progetto open source di partenza",
    title: "Calcolatrice con spiegazione del codice",
    intro: "Questa piccola app e pensata per essere facile da leggere, modificare e pubblicare su GitHub.",
    screenLabel: "Espressione",
    howToOpenTitle: "Come aprirla",
    openStepOne: "Scarica o clona il repository da GitHub.",
    openStepTwo: "Apri la cartella e fai doppio clic su index.html.",
    openStepThree: "Se vuoi un link web, attiva GitHub Pages nelle impostazioni del repository.",
    codeGuideTitle: "Come e organizzato il codice",
    codeGuideOne: "index.html contiene la struttura della pagina e i pulsanti della calcolatrice.",
    codeGuideTwo: "styles.css gestisce colori, layout e adattamento a desktop e mobile.",
    codeGuideThree: "script.js contiene la logica della calcolatrice e il cambio lingua.",
    tipTitle: "Consiglio iniziale",
    tipText: "Modifica una piccola parte per volta. Per esempio: aggiungi il tasto radice quadrata, cambia i colori oppure supporta altre lingue.",
  },
};

function isErrorState() {
  return state.expression === "Error" || state.expression === "Errore";
}

function updateDisplay() {
  display.textContent = state.expression;
}

function setLanguage(language) {
  state.language = language;

  document.documentElement.lang = language;

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    element.textContent = translations[language][key];
  });

  languageButtons.forEach((button) => {
    const isActive = button.dataset.language === language;
    button.classList.toggle("is-active", isActive);
  });
}

// This function decides how text is appended to the expression.
// It prevents a few common input mistakes like multiple decimal points
// in the same number.
function appendValue(value) {
  if (isErrorState()) {
    state.expression = "0";
  }

  const operators = /[+\-*/]/;
  const lastCharacter = state.expression.slice(-1);

  if (state.expression === "0" && /[0-9.]/.test(value)) {
    state.expression = value === "." ? "0." : value;
    return;
  }

  if (operators.test(value) && operators.test(lastCharacter)) {
    state.expression = `${state.expression.slice(0, -1)}${value}`;
    return;
  }

  if (value === ".") {
    const currentNumber = state.expression.split(/[+\-*/%]/).pop();
    if (currentNumber.includes(".")) {
      return;
    }

    if (operators.test(lastCharacter)) {
      state.expression += "0.";
      return;
    }
  }

  state.expression += value;
}

function clearExpression() {
  state.expression = "0";
}

function deleteLastCharacter() {
  if (isErrorState()) {
    clearExpression();
    return;
  }

  state.expression = state.expression.slice(0, -1) || "0";
}

// This percent action turns the last typed number into a percentage.
// Example: "50" becomes "0.5" and "120+25" becomes "120+0.25".
function applyPercent() {
  const match = state.expression.match(/(\d+(\.\d+)?)$/);

  if (!match) {
    return;
  }

  const numberText = match[0];
  const percentageValue = String(Number(numberText) / 100);

  state.expression = `${state.expression.slice(0, -numberText.length)}${percentageValue}`;
}

function calculateResult() {
  try {
    // We only allow a small safe character set before evaluating.
    if (!/^[0-9+\-*/%.() ]+$/.test(state.expression)) {
      throw new Error("Invalid characters");
    }

    const result = Function(`"use strict"; return (${state.expression})`)();

    if (!Number.isFinite(result)) {
      throw new Error("Invalid calculation");
    }

    state.expression = String(result);
  } catch (error) {
    state.expression = state.language === "it" ? "Errore" : "Error";
  }
}

function handleAction(action) {
  if (action === "clear") {
    clearExpression();
  }

  if (action === "delete") {
    deleteLastCharacter();
  }

  if (action === "percent") {
    applyPercent();
  }

  if (action === "calculate") {
    calculateResult();
  }

  updateDisplay();
}

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    const { value, action } = button.dataset;

    if (value) {
      appendValue(value);
      updateDisplay();
      return;
    }

    handleAction(action);
  });
});

languageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setLanguage(button.dataset.language);
  });
});

// Keyboard support makes the project feel more complete and shows
// how to connect browser events to app logic.
window.addEventListener("keydown", (event) => {
  if (event.key === "%") {
    applyPercent();
    updateDisplay();
  }

  if (/[0-9+\-*/().,]/.test(event.key)) {
    appendValue(event.key === "," ? "." : event.key);
    updateDisplay();
  }

  if (event.key === "Enter") {
    event.preventDefault();
    calculateResult();
    updateDisplay();
  }

  if (event.key === "Backspace") {
    deleteLastCharacter();
    updateDisplay();
  }

  if (event.key === "Escape") {
    clearExpression();
    updateDisplay();
  }
});

setLanguage(state.language);
updateDisplay();

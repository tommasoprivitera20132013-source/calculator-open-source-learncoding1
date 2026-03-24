# Code Guide

This file explains the project in a simple way.

## 1. `index.html`

This is the page skeleton.

- It contains the title, language buttons, calculator display, and calculator buttons.
- It also includes a small side panel that explains how to open the project and what each file does.
- At the bottom, it loads `script.js`.

## 2. `styles.css`

This file controls how everything looks.

- `:root` stores reusable colors and spacing values.
- The layout uses CSS Grid to place the calculator next to the notes panel.
- Media queries make the page work better on phones and smaller screens.

## 3. `script.js`

This file controls behavior.

- `state` stores the current expression and selected language.
- `translations` stores all visible text for English and Italian.
- `appendValue()` adds numbers and operators to the expression.
- `calculateResult()` evaluates the math expression and handles errors.
- Event listeners connect button clicks and keyboard input to the calculator.

## 4. Why the code is beginner-friendly

- Variable and function names are in English and try to be descriptive.
- Comments explain the goal of important parts.
- The project has no framework and no build step, so it is easy to open and inspect.

## 5. Good exercises

- Add a new button like `sqrt`
- Replace `%` with a custom percentage function
- Save the selected language in `localStorage`
- Add a calculation history panel

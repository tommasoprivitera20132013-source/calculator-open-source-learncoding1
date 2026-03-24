# Guida al Codice

Questo file spiega il progetto in modo semplice.

## 1. `index.html`

Questa e la struttura della pagina.

- Contiene il titolo, i pulsanti della lingua, il display della calcolatrice e i pulsanti dei numeri e delle operazioni.
- Include anche un pannello laterale che spiega come aprire il progetto e a cosa serve ogni file.
- In fondo carica `script.js`.

## 2. `styles.css`

Questo file controlla l'aspetto grafico.

- `:root` contiene colori e spaziature riutilizzabili.
- Il layout usa CSS Grid per mettere la calcolatrice vicino al pannello note.
- Le media query fanno funzionare meglio la pagina su schermi piccoli e telefoni.

## 3. `script.js`

Questo file controlla il comportamento.

- `state` salva l'espressione corrente e la lingua selezionata.
- `translations` contiene tutti i testi visibili in inglese e italiano.
- `appendValue()` aggiunge numeri e operatori all'espressione.
- `calculateResult()` calcola il risultato e gestisce gli errori.
- Gli event listener collegano i clic dei pulsanti e la tastiera alla logica della calcolatrice.

## 4. Perche il codice e adatto a iniziare

- I nomi di variabili e funzioni sono in inglese e cercano di essere chiari.
- I commenti spiegano lo scopo delle parti importanti.
- Il progetto non usa framework e non richiede build, quindi e facile da aprire e studiare.

## 5. Esercizi utili

- Aggiungere un nuovo pulsante come `sqrt`
- Sostituire `%` con una funzione percentuale personalizzata
- Salvare la lingua scelta in `localStorage`
- Aggiungere una cronologia dei calcoli

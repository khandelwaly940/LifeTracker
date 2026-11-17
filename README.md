# LifeTracker

A small, browser-local finance and fitness calculator at https://yashkhandelwal.me/LifeTracker/.

## Run locally

Use Node.js 22+ for tests and Python 3 for the development server.

```sh
npm run dev
npm test
```

Open http://localhost:5173. No installation or build step is required. ES modules require serving over HTTP, rather than opening the HTML file directly.

## Structure and extension points

- `index.html`: semantic, accessible section markup and controls.
- `styles.css`: design tokens, responsive layouts, and two-section A4 print styling.
- `src/app.js`: feature registry, rendering, input bindings, keyboard tabs, print and reset.
- `src/features/finance.js`, `fitness.js`: pure calculation functions and declarative metric metadata.
- `src/storage.js`: versioned, validated browser persistence. Add migrations here before changing saved data shapes.
- `tests/`: financial calculations, fitness unit conversions, and persistence schema tests.

To add a calculator, add a feature module, a matching tab/panel in HTML, register the feature in `app.js`, and add its state and validation in `storage.js`. Keep calculations independent of DOM and storage so they can be reused in future APIs, charts, or history features. Keep all asset paths relative for project-subpath hosting.

## Data and assumptions

Salary is take-home income in INR. Monthly and annual entry are two views of the same salary; switching periods converts the entered amount. Home-loan selection changes the ceiling for **all** EMIs. Retirement and emergency targets use the user's requested salary multiples, not expense-based retirement modeling. Fitness uses kg, grams, kcal and litres. These outputs are rules of thumb, not personalized financial or medical advice.

Only entered inputs and preferences are saved under `lifetracker:state` in localStorage. There is no backend, account, analytics, or transmission of entered data. Google Fonts loads font assets (system fonts are the fallback). Storage is scoped to the origin and browser profile; other code hosted on the same domain can access it. Clearing browser data removes saved inputs. The app continues calculating if storage is unavailable.

Print / Save PDF uses the browser's print dialog, with both calculator sections included. Choose Save as PDF; disable browser headers/footers for a clean report. No PDF library is needed.

## Deployment

`.github/workflows/pages.yml` tests every push to `main` and publishes only application assets to GitHub Pages. Enable Pages with **GitHub Actions** as the source. The repository must be named `LifeTracker` under `khandelwaly940`. The user-site domain `yashkhandelwal.me` is inherited; do not add a project CNAME or change the root site's DNS.

## Fitness goals

Calorie ranges use 22–25 kcal/kg for fat loss (sedentary to lightly active), 26–29 for sedentary maintenance, 30–33 for moderately active maintenance (3–5 workouts weekly), and 35–38 for muscle gain / daily training. The goal and maintenance activity selection persist alongside weight; existing saved profiles default to fat loss. The weekly weight-loss card appears only for fat loss. Other fitness formulas remain unchanged.

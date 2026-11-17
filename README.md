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

## Fitness model and evidence

Daily calories now require weight (kg), height (cm), age (whole years, 18–100), sex coefficient, activity and goal. No new demographic inputs are inferred from old data. Version 1 storage migrates to version 2 while preserving salary, weight and goal; only explicitly selected maintenance activity migrates from version 1.

- Resting energy: Mifflin–St Jeor, `10 × kg + 6.25 × cm − 5 × years + 5` (male) or `−161` (female). [Original paper](https://pubmed.ncbi.nlm.nih.gov/2305711/).
- Estimated maintenance: resting energy times a conventional activity factor: 1.2 / 1.375 / 1.55 / 1.725 / 1.9. These are estimates, not coefficients from the original paper. Activity applies independently to every goal and already includes exercise. [Public-health implementation](https://www.southkesteven.gov.uk/arts-leisure-and-culture/sports-and-leisure/health-hub/diet).
- App goal settings: maintenance unchanged; fat loss −500 kcal/day; muscle gain +300 kcal/day. These are starting adjustments, not predictions of body composition. [NHS gradual weight gain](https://www.nhs.uk/live-well/healthy-weight/managing-your-weight/healthy-ways-to-gain-weight/).
- Fat-loss targets are withheld for BMI below 18.5; a deficit is reduced at 1,200 kcal/day for the female equation or 1,500 for the male equation, and withheld if estimated maintenance is already below that limit. These are conservative app guardrails informed by [weight-management guidance](https://onlinelibrary.wiley.com/doi/full/10.1002/oby.20660), not universal safe minimums. No calorie target is produced for pregnancy/breastfeeding or incomplete/out-of-range profiles.
- Protein remains 1.6–2.2 g/kg, explicitly labeled for resistance training. [Meta-analysis](https://bjsm.bmj.com/content/52/6/376).
- Water now uses adult total-water reference values: 2.7 L female / 3.7 L male, including food and all drinks. It is not a personalized prescription or additional drinking-water target. [MedlinePlus](https://medlineplus.gov/ency/article/002471.htm).
- The original weight × 100 walking rule is retained and explicitly labeled a personal rule of thumb. Weekly weight-loss predictions were removed. General adult activity guidance is 150–300 minutes of moderate activity plus strength training on two days. [Physical Activity Guidelines](https://www.cdc.gov/physical-activity/media/pdfs/Physical_Activity_Guidelines_2nd_edition.pdf).

Model bounds (20–500 kg, 100–250 cm, 18–100 years) are input sanity checks, not claims of validation over that entire range. Mifflin–St Jeor was derived in healthy adults aged 19–78 and has individual prediction error. The UI describes estimates and includes an expandable explanation with sources. Medical conditions, pregnancy, breastfeeding or hormone therapy may need an individual approach; the sex-specific equation cannot model all physiology. Review estimated intake against observed trends rather than treating it as exact measurement.

Validation covers hand-calculated reference cases, all goals and activity levels, missing/invalid inputs, deficit limits, unit conversions, and version migration. Only displayed values are rounded; intermediate math retains precision.

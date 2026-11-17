import { calculateFinance, financeMetrics } from "./features/finance.js";
import {
  calculateFitness,
  fitnessMetrics,
  fitnessGoals,
} from "./features/fitness.js";
import { defaults, loadState, saveState, clearState } from "./storage.js";

// Each feature owns its calculations and metric definitions. Register new sections here.
const features = {
  finance: {
    metrics: financeMetrics,
    calculate: (state) =>
      calculateFinance(
        state.finance.period === "annual"
          ? Number(state.finance.salary) / 12
          : Number(state.finance.salary),
        state.finance.homeLoan,
      ),
  },
  fitness: {
    metrics: fitnessMetrics,
    calculate: (state) =>
      calculateFitness(
        Number(state.fitness.weight),
        state.fitness.goal,
        state.fitness.activity,
      ),
  },
};
const $ = (selector) => document.querySelector(selector);
const loaded = loadState();
let state = loaded.state;
const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
const number = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });
const integer = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
function format(value, type) {
  const formatter =
    type === "currency" ? currency : type === "integer" ? integer : number;
  return Array.isArray(value)
    ? value.map((v) => formatter.format(v)).join(" – ")
    : formatter.format(value);
}
function buildCards() {
  for (const [name, feature] of Object.entries(features)) {
    $(`#${name}-results`).innerHTML = feature.metrics
      .map(
        (metric) => `
      <article class="metric-card ${metric.hero ? "hero-card" : ""}">
        ${metric.hero ? `<div class="hero-top"><span class="card-kicker">${metric.badge}</span><span class="hero-orbit" aria-hidden="true">↗</span></div>` : `<div class="metric-top"><span class="metric-icon" aria-hidden="true">${metric.icon}</span><span class="metric-tag">${metric.tag}</span></div>`}
        <h3>${metric.title}</h3><p class="metric-value" id="${name}-${metric.key}">—</p>
        <p class="metric-detail">${metric.detail}</p><p class="metric-formula" id="formula-${name}-${metric.key}"></p>
      </article>`,
      )
      .join("");
  }
}
function renderResults() {
  for (const [name, feature] of Object.entries(features)) {
    const result = feature.calculate(state);
    for (const metric of feature.metrics) {
      const el = $(`#${name}-${metric.key}`);
      el.closest("article").hidden = metric.visible
        ? !metric.visible(state)
        : false;
      el.textContent = result ? format(result[metric.key], metric.format) : "—";
      if (result && metric.unit) {
        const unit = document.createElement("span");
        unit.className = "value-unit";
        unit.textContent = metric.unit;
        el.append(unit);
      }
      $(`#formula-${name}-${metric.key}`).textContent =
        typeof metric.formula === "function"
          ? metric.formula(state)
          : metric.formula;
    }
  }
  $("#maintenance-activity").hidden = state.fitness.goal !== "maintenance";
  $("#goal-context").textContent =
    state.fitness.goal === "maintenance"
      ? ""
      : fitnessGoals[state.fitness.goal].activity;
  const annual = state.finance.period === "annual";
  $("#salary-label").textContent = `${annual ? "Annual" : "Monthly"} take-home`;
  $("#salary-equivalent").textContent = state.finance.salary
    ? `${currency.format(Number(state.finance.salary) * (annual ? 1 / 12 : 12))} / ${annual ? "month" : "year"}`
    : `Your ${annual ? "monthly" : "annual"} salary will appear here.`;
}
function renderTab() {
  for (const name of Object.keys(features)) {
    const active = name === state.tab;
    $(`#panel-${name}`).hidden = !active;
    $(`#tab-${name}`).setAttribute("aria-selected", String(active));
    $(`#tab-${name}`).tabIndex = active ? 0 : -1;
  }
}
function persist() {
  $("#save-status").textContent = saveState(state)
    ? "Saved on this device"
    : "Storage unavailable · changes are temporary";
}
function syncInputs() {
  $("#salary").value = state.finance.salary;
  $("#weight").value = state.fitness.weight;
  $("#fitness-goal").value = state.fitness.goal;
  $("#fitness-activity").value = state.fitness.activity;
  $(`[name="period"][value="${state.finance.period}"]`).checked = true;
  $("#home-loan").checked = state.finance.homeLoan;
}
function bindNumber(id, target, key, max) {
  $(`#${id}`).addEventListener("input", (event) => {
    const input = event.target;
    const valid =
      !input.validity.badInput &&
      (input.value === "" ||
        (Number(input.value) > 0 && Number(input.value) <= max));
    input.setAttribute("aria-invalid", String(!valid));
    $(`#${id}-error`).textContent = valid
      ? ""
      : `Enter a number greater than 0 and up to ${number.format(max)}.`;
    state[target][key] = valid ? input.value : "";
    renderResults();
    persist();
  });
}
buildCards();
syncInputs();
renderResults();
renderTab();
if (!loaded.available)
  $("#save-status").textContent = "Saved data unavailable · starting fresh";
bindNumber("salary", "finance", "salary", 1e10);
bindNumber("weight", "fitness", "weight", 500);
for (const [id, key] of [
  ["fitness-goal", "goal"],
  ["fitness-activity", "activity"],
]) {
  $("#" + id).addEventListener("change", (event) => {
    state.fitness[key] = event.target.value;
    renderResults();
    persist();
  });
}
for (const input of document.querySelectorAll('[name="period"]'))
  input.addEventListener("change", () => {
    if (state.finance.salary)
      state.finance.salary = String(
        Math.round(
          Number(state.finance.salary) *
            (input.value === "annual" ? 12 : 1 / 12) *
            100,
        ) / 100,
      );
    state.finance.period = input.value;
    // Keep the converted value within the supported input range.
    if (Number(state.finance.salary) > 1e10) state.finance.salary = "";
    syncInputs();
    renderResults();
    persist();
  });
$("#home-loan").addEventListener("change", (event) => {
  state.finance.homeLoan = event.target.checked;
  renderResults();
  persist();
});
for (const tab of document.querySelectorAll("[data-tab]")) {
  tab.addEventListener("click", () => {
    state.tab = tab.dataset.tab;
    renderTab();
    persist();
  });
  tab.addEventListener("keydown", (event) => {
    const names = Object.keys(features);
    let index = names.indexOf(state.tab);
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    index =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? names.length - 1
          : (index + (event.key === "ArrowRight" ? 1 : -1) + names.length) %
            names.length;
    $(`#tab-${names[index]}`).click();
    $(`#tab-${names[index]}`).focus();
  });
}
function preparePrint() {
  $("#print-date").textContent =
    `LifeTracker · Personal snapshot · ${new Intl.DateTimeFormat("en-IN", { dateStyle: "long" }).format(new Date())}`;
}
window.addEventListener("beforeprint", preparePrint);
$("#print").addEventListener("click", () => {
  preparePrint();
  window.print();
});
$("#reset").addEventListener("click", () => $("#reset-dialog").showModal());
$("#reset-dialog").addEventListener("close", () => {
  if ($("#reset-dialog").returnValue !== "reset") return;
  state = defaults();
  const cleared = clearState();
  syncInputs();
  renderResults();
  renderTab();
  for (const id of ["salary", "weight"]) {
    $(`#${id}-error`).textContent = "";
    $(`#${id}`).removeAttribute("aria-invalid");
  }
  $("#save-status").textContent = cleared
    ? "Data cleared · a fresh start"
    : "Could not clear browser storage";
});

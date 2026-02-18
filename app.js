const STORAGE_KEY = "ohvale-wiki-content";
const ADMIN_PASSWORD = "ohvale-admin";

const defaults = {
  host: "play.ohvalecity.it",
  rules: [
    "No RDM: ogni azione violenta deve avere un motivo RP reale e coerente.",
    "No VDM: non usare veicoli per uccidere o ferire senza contesto roleplay valido.",
    "Ogni azione deve avere senso RP: evita comportamenti no-sense o fuori personaggio.",
    "Rispetta FearRP e Value of Life: il tuo personaggio tiene alla propria vita.",
    "No metagaming e no powergaming: usa solo informazioni ottenute in RP e senza forzature.",
    "Niente insulti, tossicità o flame in chat vocale/testuale: rispetto verso tutti.",
    "Segui sempre le indicazioni dello staff durante scene, eventi e ticket.",
  ],
  faq: [
    {
      q: "Come entro nel server?",
      a: "Apri Minecraft, Multiplayer, Aggiungi server e inserisci l'host indicato sopra.",
    },
    {
      q: "È whitelistato?",
      a: "Controlla nel canale Discord #annunci: la whitelist può cambiare in base alla stagione.",
    },
    {
      q: "Come apro un ticket?",
      a: "Usa il bot ticket su Discord e descrivi chiaramente il problema con screenshot/video.",
    },
  ],
  guides: [
    { title: "Primi passi", text: "Spawn, comandi base e come trovare lavoro RP." },
    { title: "Economia", text: "Moneta, negozi e scambi consentiti nel roleplay." },
    { title: "Fazioni", text: "Come entrare in una fazione e regole di guerra RP." },
  ],
};

const state = loadState();

const els = {
  host: document.getElementById("serverHost"),
  status: document.getElementById("serverStatus"),
  refresh: document.getElementById("refreshStatus"),
  faqList: document.getElementById("faqList"),
  rulesList: document.getElementById("rulesList"),
  guidesList: document.getElementById("guidesList"),
  searchInput: document.getElementById("searchInput"),
  adminToggle: document.getElementById("adminToggle"),
  adminDialog: document.getElementById("adminDialog"),
  adminAuthForm: document.getElementById("adminAuthForm"),
  adminPassword: document.getElementById("adminPassword"),
  adminPanel: document.getElementById("adminPanel"),
  hostInput: document.getElementById("hostInput"),
  newRule: document.getElementById("newRule"),
  addRule: document.getElementById("addRule"),
  newFaqQ: document.getElementById("newFaqQ"),
  newFaqA: document.getElementById("newFaqA"),
  addFaq: document.getElementById("addFaq"),
  saveAdmin: document.getElementById("saveAdmin"),
  closeAdmin: document.getElementById("closeAdmin"),
};

renderAll();
fetchServerStatus();

els.refresh.addEventListener("click", fetchServerStatus);
els.searchInput.addEventListener("input", filterContent);
els.adminToggle.addEventListener("click", () => {
  els.adminDialog.showModal();
});

els.adminAuthForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (els.adminPassword.value !== ADMIN_PASSWORD) {
    els.adminPassword.setCustomValidity("Password non valida");
    els.adminPassword.reportValidity();
    return;
  }

  els.adminPassword.setCustomValidity("");
  els.adminAuthForm.hidden = true;
  els.adminPanel.hidden = false;
  els.hostInput.value = state.host;
});

els.closeAdmin.addEventListener("click", () => closeAdminDialog());
els.adminDialog.addEventListener("cancel", () => closeAdminDialog());

els.addRule.addEventListener("click", () => {
  const value = els.newRule.value.trim();
  if (!value) return;
  state.rules.push(value);
  els.newRule.value = "";
  renderRules();
});

els.addFaq.addEventListener("click", () => {
  const q = els.newFaqQ.value.trim();
  const a = els.newFaqA.value.trim();
  if (!q || !a) return;
  state.faq.push({ q, a });
  els.newFaqQ.value = "";
  els.newFaqA.value = "";
  renderFaq();
});

els.saveAdmin.addEventListener("click", () => {
  const host = els.hostInput.value.trim();
  state.host = host || defaults.host;
  saveState(state);
  renderAll();
  closeAdminDialog();
});

function renderAll() {
  renderHost();
  renderFaq();
  renderRules();
  renderGuides();
}

function renderHost() {
  els.host.textContent = state.host;
}

function renderFaq() {
  els.faqList.innerHTML = state.faq
    .map(
      (entry) => `
      <article class="faq-item searchable-item">
        <h3>${escapeHtml(entry.q)}</h3>
        <p>${escapeHtml(entry.a)}</p>
      </article>
    `,
    )
    .join("");
}

function renderRules() {
  els.rulesList.innerHTML = state.rules
    .map((rule) => `<li class="searchable-item">${escapeHtml(rule)}</li>`)
    .join("");
}

function renderGuides() {
  els.guidesList.innerHTML = state.guides
    .map(
      (guide) => `
      <article class="guide searchable-item">
        <h3>${escapeHtml(guide.title)}</h3>
        <p>${escapeHtml(guide.text)}</p>
      </article>
    `,
    )
    .join("");
}

async function fetchServerStatus() {
  els.status.textContent = "Aggiornamento stato in corso...";

  try {
    const response = await fetch(`https://api.mcsrvstat.us/2/${encodeURIComponent(state.host)}`);
    if (!response.ok) throw new Error("API offline");

    const data = await response.json();

    if (!data.online) {
      els.status.textContent = "Server offline o non raggiungibile in questo momento.";
      return;
    }

    const online = data.players?.online ?? 0;
    const max = data.players?.max ?? "?";
    els.status.textContent = `🟢 Online: ${online}/${max} player`;
  } catch (error) {
    els.status.textContent =
      "Impossibile leggere lo stato server adesso. Controlla host o connessione API.";
  }
}

function filterContent() {
  const query = els.searchInput.value.trim().toLowerCase();
  const items = document.querySelectorAll(".searchable-item");

  items.forEach((item) => {
    const text = item.textContent.toLowerCase();
    item.style.display = text.includes(query) ? "" : "none";
  });
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return structuredClone(defaults);

  try {
    return { ...structuredClone(defaults), ...JSON.parse(raw) };
  } catch {
    return structuredClone(defaults);
  }
}

function saveState(nextState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
}

function closeAdminDialog() {
  els.adminDialog.close();
  els.adminAuthForm.reset();
  els.adminAuthForm.hidden = false;
  els.adminPanel.hidden = true;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

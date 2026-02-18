const LOGIN_KEY = "fcid-session";
const LOGIN_ROLE_KEY = "fcid-role";
const WANTED_KEY = "fcid-wanted";
const LINKS_KEY = "fcid-investigation-links";
const WEAPONS_KEY = "fcid-weapons";

const ACCESS = {
  user: { id: "FC-214", passcode: "fortcarson" },
  admin: { id: "FC-ADMIN", passcode: "fortadmin" },
};

const detectives = [
  { id: "FC-214", name: "Lt. Mason Reed", unit: "CID Alpha", status: "On Duty" },
  { id: "FC-327", name: "Sgt. Elena Rossi", unit: "Digital Forensics", status: "In Lab" },
  { id: "FC-198", name: "Det. Marcus Hayes", unit: "Field Intel", status: "In Patrol" },
  { id: "FC-412", name: "Det. Linda Ortega", unit: "Interviews", status: "Briefing" },
];

const openCases = [
  { code: "CASE-19A", title: "Operazione Sandtrail", priority: "Alta" },
  { code: "CASE-27C", title: "Traffico componenti militari", priority: "Critica" },
  { code: "CASE-08F", title: "Accessi non autorizzati a deposito", priority: "Media" },
];

const documentation = [
  "Protocollo interrogatori CID v3.4",
  "Checklist Digital Evidence Handling",
  "Linee guida catena di custodia",
  "Manuale rischio operativo in campo",
];

const defaultArmoryRegister = [
  "M4A1 - Serial FCM4-7721 - Assegnata a Unit Bravo",
  "G17 - Serial FCG17-3120 - Armory shelf B2",
  "Taser X26 - Serial FCX26-9914 - In manutenzione",
  "Bodycam AXON-12 - Serial FCAX-1008 - In uso operativo",
];

const records = [
  {
    name: "Miller, John",
    alias: "Ghostline",
    status: "Sorveglianza attiva",
    note: "Contatti frequenti con rete contrabbando locale.",
  },
  {
    name: "Ortega, Linda",
    alias: "Lynx",
    status: "Interrogatorio completato",
    note: "Cooperazione parziale, in verifica incongruenze timeline.",
  },
  {
    name: "Hayes, Marcus",
    alias: "N/A",
    status: "Mandato in preparazione",
    note: "Tracce finanziarie collegate a wallet offshore.",
  },
  {
    name: "Rossi, Elena",
    alias: "Red Falcon",
    status: "Case file archiviato",
    note: "Riapertura possibile su nuove prove biometriche.",
  },
];

const defaultWanted = [
  { name: "Bennett, Carl", alias: "North Wolf", danger: "Alto", note: "Ricercato per furto armamenti" },
  { name: "Wright, Zoe", alias: "Phantom", danger: "Medio", note: "Frode documentale su supply chain" },
];

const defaultLinks = [
  { label: "Sheet indagine Sandtrail", url: "https://docs.google.com/" },
  { label: "Dossier armi sospette", url: "https://docs.google.com/" },
];

const timelineEvents = [
  "07:35 — Accesso laboratori digital forensics completato.",
  "08:10 — Nuovo dossier caricato: Operazione Sandtrail.",
  "09:00 — Alert geofence: soggetto Miller in zona sensibile.",
  "09:42 — Richiesta supporto campo da Tactical Unit Bravo.",
  "10:14 — Documentazione prove aggiornata da Sgt. Rossi.",
];

const els = {
  loginScreen: document.getElementById("loginScreen"),
  dashboard: document.getElementById("dashboard"),
  loginForm: document.getElementById("loginForm"),
  agentId: document.getElementById("agentId"),
  passcode: document.getElementById("passcode"),
  loginError: document.getElementById("loginError"),
  sessionRole: document.getElementById("sessionRole"),
  logoutButton: document.getElementById("logoutButton"),
  searchInput: document.getElementById("searchInput"),
  recordsList: document.getElementById("recordsList"),
  timeline: document.getElementById("timeline"),
  statsList: document.getElementById("statsList"),
  agentsList: document.getElementById("agentsList"),
  casesList: document.getElementById("casesList"),
  docsList: document.getElementById("docsList"),
  weaponsList: document.getElementById("weaponsList"),
  wantedList: document.getElementById("wantedList"),
  linksList: document.getElementById("linksList"),
  weaponForm: document.getElementById("weaponForm"),
  adminPanel: document.getElementById("adminPanel"),
  wantedForm: document.getElementById("wantedForm"),
  investigationForm: document.getElementById("investigationForm"),
  adminMessage: document.getElementById("adminMessage"),
};

let wanted = loadList(WANTED_KEY, defaultWanted);
let investigationLinks = loadList(LINKS_KEY, defaultLinks);
let armoryRegister = loadList(WEAPONS_KEY, defaultArmoryRegister);

init();

function init() {
  const isLogged = localStorage.getItem(LOGIN_KEY) === "1";
  const role = localStorage.getItem(LOGIN_ROLE_KEY) || "guest";

  toggleSession(isLogged, role);

  renderAgents();
  renderCases();
  renderDocs();
  renderWeapons();
  renderWanted();
  renderTimeline();
  renderStats();
  renderRecords(records);
  renderLinks();

  els.loginForm.addEventListener("submit", handleLogin);
  els.logoutButton.addEventListener("click", handleLogout);
  els.searchInput.addEventListener("input", handleSearch);
  els.weaponForm.addEventListener("submit", handleAddWeaponEntry);
  els.linksList.addEventListener("click", handleCloseInvestigation);
  els.wantedForm.addEventListener("submit", handleAddWanted);
  els.investigationForm.addEventListener("submit", handleAddInvestigationLink);
}

function handleLogin(event) {
  event.preventDefault();

  const id = els.agentId.value.trim().toUpperCase();
  const pass = els.passcode.value.trim().toLowerCase();

  let role = "";

  if (id === ACCESS.admin.id && pass === ACCESS.admin.passcode) {
    role = "admin";
  } else if (id === ACCESS.user.id && pass === ACCESS.user.passcode) {
    role = "user";
  }

  if (!role) {
    els.loginError.textContent = "Credenziali non valide. Verifica Agent ID e passcode.";
    return;
  }

  els.loginError.textContent = "";
  localStorage.setItem(LOGIN_KEY, "1");
  localStorage.setItem(LOGIN_ROLE_KEY, role);
  toggleSession(true, role);
}

function handleLogout() {
  localStorage.removeItem(LOGIN_KEY);
  localStorage.removeItem(LOGIN_ROLE_KEY);
  els.loginForm.reset();
  toggleSession(false, "guest");
}

function handleSearch() {
  const query = els.searchInput.value.trim().toLowerCase();
  const filtered = records.filter((record) => {
    const target = `${record.name} ${record.alias} ${record.status} ${record.note}`.toLowerCase();
    return target.includes(query);
  });

  renderRecords(filtered);
}


function handleAddWeaponEntry(event) {
  event.preventDefault();

  const formData = new FormData(els.weaponForm);
  const entry = String(formData.get("weaponEntry") || "").trim();

  if (!entry) {
    return;
  }

  armoryRegister.unshift(entry);
  persistList(WEAPONS_KEY, armoryRegister);
  renderWeapons();
  els.weaponForm.reset();
}

function handleCloseInvestigation(event) {
  const button = event.target.closest("button[data-close-link]");
  if (!button) {
    return;
  }

  const index = Number(button.dataset.closeLink);
  if (!Number.isInteger(index) || index < 0 || index >= investigationLinks.length) {
    return;
  }

  investigationLinks.splice(index, 1);
  persistList(LINKS_KEY, investigationLinks);
  renderLinks();
  renderStats();

  if (isAdmin()) {
    setAdminMessage("Indagine contrassegnata come chiusa e rimossa dal database locale.");
  }
}

function handleAddWanted(event) {
  event.preventDefault();

  if (!isAdmin()) {
    setAdminMessage("Solo admin può aggiungere ricercati.");
    return;
  }

  const formData = new FormData(els.wantedForm);
  const item = {
    name: String(formData.get("wantedName") || "").trim(),
    alias: String(formData.get("wantedAlias") || "").trim(),
    danger: String(formData.get("wantedDanger") || "").trim(),
    note: String(formData.get("wantedNote") || "").trim(),
  };

  if (!item.name || !item.alias || !item.danger || !item.note) {
    setAdminMessage("Compila tutti i campi del ricercato.");
    return;
  }

  wanted.unshift(item);
  persistList(WANTED_KEY, wanted);
  renderWanted();
  renderStats();
  els.wantedForm.reset();
  setAdminMessage("Ricercato aggiunto correttamente.");
}

function handleAddInvestigationLink(event) {
  event.preventDefault();

  if (!isAdmin()) {
    setAdminMessage("Solo admin può aggiungere link indagini.");
    return;
  }

  const formData = new FormData(els.investigationForm);
  const label = String(formData.get("investigationTitle") || "").trim();
  const url = String(formData.get("investigationUrl") || "").trim();

  if (!label || !isLikelyUrl(url)) {
    setAdminMessage("Inserisci titolo e URL valido (http/https).");
    return;
  }

  investigationLinks.unshift({ label, url });
  persistList(LINKS_KEY, investigationLinks);
  renderLinks();
  els.investigationForm.reset();
  setAdminMessage("Link indagine salvato. Ora è cliccabile per gli utenti autorizzati.");
}

function renderAgents() {
  els.agentsList.innerHTML = detectives
    .map(
      (agent) => `
        <article class="tile">
          <strong>${escapeHtml(agent.name)}</strong>
          <p>ID: ${escapeHtml(agent.id)}</p>
          <p>Unità: ${escapeHtml(agent.unit)}</p>
          <p class="pill">${escapeHtml(agent.status)}</p>
        </article>
      `,
    )
    .join("");
}

function renderCases() {
  els.casesList.innerHTML = openCases
    .map(
      (item) => `
        <article class="tile">
          <strong>${escapeHtml(item.code)}</strong>
          <p>${escapeHtml(item.title)}</p>
          <p class="pill">Priorità: ${escapeHtml(item.priority)}</p>
        </article>
      `,
    )
    .join("");
}

function renderDocs() {
  els.docsList.innerHTML = documentation
    .map((entry) => `<article class="tile"><p>${escapeHtml(entry)}</p></article>`)
    .join("");
}

function renderWeapons() {
  els.weaponsList.innerHTML = armoryRegister
    .map((entry) => `<article class="tile"><p>${escapeHtml(entry)}</p></article>`)
    .join("");
}

function renderWanted() {
  els.wantedList.innerHTML = wanted
    .map(
      (item) => `
        <article class="record">
          <strong>${escapeHtml(item.name)}</strong>
          <p>Alias: ${escapeHtml(item.alias)}</p>
          <p>Livello: ${escapeHtml(item.danger)}</p>
          <p>Nota: ${escapeHtml(item.note)}</p>
        </article>
      `,
    )
    .join("");
}

function renderRecords(list) {
  if (!list.length) {
    els.recordsList.innerHTML = '<p class="muted">Nessun record trovato.</p>';
    return;
  }

  els.recordsList.innerHTML = list
    .map(
      (record) => `
        <article class="record">
          <strong>${escapeHtml(record.name)}</strong>
          <p>Alias: ${escapeHtml(record.alias)}</p>
          <p>Stato: ${escapeHtml(record.status)}</p>
          <p>Nota: ${escapeHtml(record.note)}</p>
        </article>
      `,
    )
    .join("");
}

function renderTimeline() {
  els.timeline.innerHTML = timelineEvents
    .map((entry) => `<div class="timeline-item">${escapeHtml(entry)}</div>`)
    .join("");
}

function renderLinks() {
  els.linksList.innerHTML = investigationLinks
    .map(
      (entry, index) => `
        <article class="link-card">
          <a href="${escapeAttribute(entry.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(entry.label)}</a>
          <button class="button ghost close-btn" type="button" data-close-link="${index}">Chiudi indagine</button>
        </article>
      `,
    )
    .join("");
}

function renderStats() {
  const stats = [
    `Casi aperti: ${openCases.length}`,
    `Detective disponibili: ${detectives.length}`,
    `Ricercati attivi: ${wanted.length}`,
    `Link indagini: ${investigationLinks.length}`,
  ];

  els.statsList.innerHTML = stats.map((entry) => `<li>${escapeHtml(entry)}</li>`).join("");
}

function toggleSession(isLogged, role) {
  els.loginScreen.hidden = isLogged;
  els.dashboard.hidden = !isLogged;
  els.adminPanel.hidden = !(isLogged && role === "admin");

  if (isLogged && role === "admin") {
    els.sessionRole.textContent = "Sessione: Admin";
  } else if (isLogged) {
    els.sessionRole.textContent = "Sessione: Operatore";
  } else {
    els.sessionRole.textContent = "";
  }
}

function isAdmin() {
  return localStorage.getItem(LOGIN_ROLE_KEY) === "admin";
}

function setAdminMessage(text) {
  els.adminMessage.textContent = text;
}

function loadList(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) {
    persistList(key, fallback);
    return [...fallback];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [...fallback];
  } catch {
    return [...fallback];
  }
}

function persistList(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function isLikelyUrl(value) {
  return /^https?:\/\//i.test(value);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

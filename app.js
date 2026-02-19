const LOGIN_KEY = "fcid-session";
const LOGIN_ROLE_KEY = "fcid-role";
const LOGIN_ID_KEY = "fcid-agent-id";
const AGENTS_KEY = "fcid-agents";
const WANTED_KEY = "fcid-wanted";
const LINKS_KEY = "fcid-investigation-links";
const WEAPONS_KEY = "fcid-weapons";

const BOOTSTRAP_ADMIN = { id: "FC-ADMIN", passcode: "fortadmin" };

const defaultAgents = [];

const openCases = [];

const documentation = [
  "Protocollo interrogatori CID v3.4",
  "Checklist Digital Evidence Handling",
  "Linee guida catena di custodia",
  "Manuale rischio operativo in campo",
];

const regulations = [
  "Ogni accesso ai dati investigativi deve essere tracciato e motivato.",
  "Gli operatori aggiornano il proprio stato operativo e assegnazione indagini.",
  "Il grado investigativo è impostato/modificato esclusivamente dall'admin.",
  "Le indagini chiuse vengono rimosse dal database locale operativo.",
];

const usefulLinks = [
  { label: "Portale documentazione interna", url: "https://docs.google.com/" },
  { label: "Modulo richiesta supporto forense", url: "https://forms.google.com/" },
  { label: "Knowledge base catena di custodia", url: "https://drive.google.com/" },
];

const defaultArmoryRegister = [];

const defaultWanted = [
  { name: "Bennett, Carl", alias: "North Wolf", danger: "Alto", note: "Ricercato per furto armamenti" },
  { name: "Wright, Zoe", alias: "Phantom", danger: "Medio", note: "Frode documentale su supply chain" },
  { name: "Larsen, Viktor", alias: "Icepit", danger: "Alto", note: "Sospetto traffico componenti dual use" },
];

const defaultLinks = [
  { label: "Sheet indagine Sandtrail", url: "https://docs.google.com/" },
  { label: "Dossier armi sospette", url: "https://docs.google.com/" },
  { label: "Foglio intelligence confini", url: "https://docs.google.com/" },
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
  statsList: document.getElementById("statsList"),
  agentsList: document.getElementById("agentsList"),
  casesList: document.getElementById("casesList"),
  docsList: document.getElementById("docsList"),
  regulationsList: document.getElementById("regulationsList"),
  usefulLinksList: document.getElementById("usefulLinksList"),
  weaponsList: document.getElementById("weaponsList"),
  wantedList: document.getElementById("wantedList"),
  linksList: document.getElementById("linksList"),
  weaponForm: document.getElementById("weaponForm"),
  adminPanel: document.getElementById("adminPanel"),
  wantedForm: document.getElementById("wantedForm"),
  investigationForm: document.getElementById("investigationForm"),
  agentForm: document.getElementById("agentForm"),
  adminMessage: document.getElementById("adminMessage"),
};

let agents = loadList(AGENTS_KEY, defaultAgents, true);
let wanted = loadList(WANTED_KEY, defaultWanted, true);
let investigationLinks = loadList(LINKS_KEY, defaultLinks, false);
let armoryRegister = loadList(WEAPONS_KEY, defaultArmoryRegister, true);

ensureAgentSchema();
init();

function init() {
  const isLogged = localStorage.getItem(LOGIN_KEY) === "1";
  const role = localStorage.getItem(LOGIN_ROLE_KEY) || "guest";

  toggleSession(isLogged, role);
  renderAll();

  els.loginForm.addEventListener("submit", handleLogin);
  els.logoutButton.addEventListener("click", handleLogout);
  els.weaponForm.addEventListener("submit", handleAddWeaponEntry);
  els.linksList.addEventListener("click", handleCloseInvestigation);
  els.wantedForm.addEventListener("submit", handleAddWanted);
  els.investigationForm.addEventListener("submit", handleAddInvestigationLink);
  els.agentForm.addEventListener("submit", handleAddAgent);
  els.agentsList.addEventListener("submit", handleAgentUpdate);
  els.agentsList.addEventListener("click", handleRemoveAgent);
}

function renderAll() {
  renderAgents();
  renderCases();
  renderDocs();
  renderRegulations();
  renderUsefulLinks();
  renderWeapons();
  renderWanted();
  renderStats();
  renderLinks();
}

function handleLogin(event) {
  event.preventDefault();

  const id = els.agentId.value.trim().toUpperCase();
  const pass = els.passcode.value.trim();
  const agent = findAgent(id);

  if (!agent && id === BOOTSTRAP_ADMIN.id && pass === BOOTSTRAP_ADMIN.passcode) {
    localStorage.setItem(LOGIN_KEY, "1");
    localStorage.setItem(LOGIN_ROLE_KEY, "admin");
    localStorage.setItem(LOGIN_ID_KEY, BOOTSTRAP_ADMIN.id);
    els.loginError.textContent = "";
    toggleSession(true, "admin");
    renderAgents();
    return;
  }

  if (!agent || agent.passcode !== pass) {
    els.loginError.textContent = "Credenziali non valide. Verifica Agent ID e passcode.";
    return;
  }

  els.loginError.textContent = "";
  localStorage.setItem(LOGIN_KEY, "1");
  localStorage.setItem(LOGIN_ROLE_KEY, agent.role);
  localStorage.setItem(LOGIN_ID_KEY, agent.id);
  toggleSession(true, agent.role);
  renderAgents();
}

function handleLogout() {
  localStorage.removeItem(LOGIN_KEY);
  localStorage.removeItem(LOGIN_ROLE_KEY);
  localStorage.removeItem(LOGIN_ID_KEY);
  els.loginForm.reset();
  toggleSession(false, "guest");
}

function handleAgentUpdate(event) {
  event.preventDefault();

  const form = event.target.closest("form[data-agent-update]");
  if (!form) return;

  const currentAgent = getCurrentAgent();
  const isAdminRole = getCurrentRole() === "admin";
  if (!currentAgent && !isAdminRole) return;

  const targetId = form.dataset.agentUpdate;
  const target = findAgent(targetId);
  if (!target) return;

  const canEdit = isAdminRole || (currentAgent && currentAgent.id === targetId);
  if (!canEdit) return;

  const formData = new FormData(form);
  const status = String(formData.get("status") || "").trim();
  const assignedCases = Number(formData.get("assignedCases"));

  if (!status || ![1, 2, 3].includes(assignedCases)) return;

  target.status = status;
  target.assignedCases = assignedCases;

  if (isAdminRole) {
    const name = String(formData.get("name") || "").trim();
    const unit = String(formData.get("unit") || "").trim();
    const grade = String(formData.get("grade") || "").trim();

    target.name = name || target.name;
    target.unit = unit || target.unit;
    target.grade = grade || target.grade;
    setAdminMessage(`Profilo agente ${target.id} aggiornato.`);
  }

  persistList(AGENTS_KEY, agents);
  renderAgents();
  renderStats();
}

function handleRemoveAgent(event) {
  const button = event.target.closest("button[data-remove-agent]");
  if (!button || getCurrentRole() !== "admin") return;

  const targetId = button.dataset.removeAgent;
  const index = agents.findIndex((agent) => agent.id === targetId);
  if (index < 0) return;

  agents.splice(index, 1);
  persistList(AGENTS_KEY, agents);
  renderAgents();
  renderStats();
  setAdminMessage(`Agente ${targetId} rimosso dal registro.`);
}

function handleAddWeaponEntry(event) {
  event.preventDefault();
  const formData = new FormData(els.weaponForm);
  const entry = String(formData.get("weaponEntry") || "").trim();
  if (!entry) return;

  armoryRegister.unshift(entry);
  persistList(WEAPONS_KEY, armoryRegister);
  renderWeapons();
  renderStats();
  els.weaponForm.reset();
}

function handleCloseInvestigation(event) {
  const button = event.target.closest("button[data-close-link]");
  if (!button) return;

  const index = Number(button.dataset.closeLink);
  if (!Number.isInteger(index) || index < 0 || index >= investigationLinks.length) return;

  investigationLinks.splice(index, 1);
  persistList(LINKS_KEY, investigationLinks);
  renderLinks();
  renderStats();

  if (isAdmin()) {
    setAdminMessage("Indagine chiusa e rimossa dal database locale.");
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
  renderStats();
  els.investigationForm.reset();
  setAdminMessage("Link indagine salvato.");
}

function handleAddAgent(event) {
  event.preventDefault();
  if (!isAdmin()) {
    setAdminMessage("Solo admin può aggiungere agenti.");
    return;
  }

  const formData = new FormData(els.agentForm);
  const id = String(formData.get("newAgentId") || "").trim().toUpperCase();
  const passcode = String(formData.get("newAgentPasscode") || "").trim();
  const name = String(formData.get("newAgentName") || "").trim();
  const unit = String(formData.get("newAgentUnit") || "").trim();
  const grade = String(formData.get("newAgentGrade") || "").trim();
  const status = String(formData.get("newAgentStatus") || "").trim();
  const assignedCases = Number(formData.get("newAgentAssignedCases"));

  if (!id || !passcode || !name || !unit || !grade || !status || ![1, 2, 3].includes(assignedCases)) {
    setAdminMessage("Compila tutti i campi del nuovo agente.");
    return;
  }

  if (agents.some((agent) => agent.id === id)) {
    setAdminMessage("ID agente già presente.");
    return;
  }

  agents.unshift({ id, passcode, name, unit, grade, status, assignedCases, role: "user" });
  persistList(AGENTS_KEY, agents);
  renderAgents();
  renderStats();
  els.agentForm.reset();
  setAdminMessage(`Agente ${id} creato con credenziali attive.`);
}

function renderAgents() {
  const currentAgent = getCurrentAgent();
  const isAdminViewer = getCurrentRole() === "admin";

  if (!agents.length) {
    els.agentsList.innerHTML = '<p class="muted">Nessun agente registrato.</p>';
    return;
  }

  els.agentsList.innerHTML = agents
    .map((agent) => {
      const editable = isAdminViewer || Boolean(currentAgent && currentAgent.id === agent.id);
      const profileType = agent.role === "admin" ? "Admin" : "Operatore";

      return `
        <article class="tile ${editable ? "tile-editable" : ""}">
          <div class="tile-head">
            <strong>${escapeHtml(agent.name)}</strong>
            <span class="pill">${escapeHtml(profileType)}</span>
          </div>
          <p>ID: ${escapeHtml(agent.id)}</p>
          <p>Grado: ${escapeHtml(agent.grade || "Detective")}</p>
          <p>Unità: ${escapeHtml(agent.unit)}</p>
          <p>Stato: ${escapeHtml(agent.status)}</p>
          <p>Assegnato a ${agent.assignedCases} indagini</p>

          ${
            editable
              ? `
            <form class="agent-edit-form" data-agent-update="${escapeAttribute(agent.id)}">
              ${
                isAdminViewer
                  ? `
                <label>Nome</label>
                <input name="name" type="text" value="${escapeAttribute(agent.name)}" required />
                <label>Unità</label>
                <input name="unit" type="text" value="${escapeAttribute(agent.unit)}" required />
                <label>Grado investigativo</label>
                <input name="grade" type="text" value="${escapeAttribute(agent.grade || "Detective")}" required />
              `
                  : ""
              }

              <label>Stato operativo</label>
              <input name="status" type="text" value="${escapeAttribute(agent.status)}" required />
              <label>Assegnazione indagini</label>
              <select name="assignedCases" required>
                ${[1, 2, 3]
                  .map(
                    (count) =>
                      `<option value="${count}" ${agent.assignedCases === count ? "selected" : ""}>${count} indagini</option>`,
                  )
                  .join("")}
              </select>
              <button class="button ghost" type="submit">Aggiorna profilo</button>
            </form>

            ${
              isAdminViewer
                ? `<button class="button ghost remove-btn" type="button" data-remove-agent="${escapeAttribute(agent.id)}">Rimuovi agente</button>`
                : ""
            }
          `
              : ""
          }
        </article>
      `;
    })
    .join("");
}

function renderCases() {
  if (!openCases.length) {
    els.casesList.innerHTML = '<p class="muted">Nessun caso aperto registrato.</p>';
    return;
  }

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
  els.docsList.innerHTML = documentation.map((entry) => `<article class="tile"><p>${escapeHtml(entry)}</p></article>`).join("");
}

function renderRegulations() {
  els.regulationsList.innerHTML = regulations.map((entry) => `<li>${escapeHtml(entry)}</li>`).join("");
}

function renderUsefulLinks() {
  els.usefulLinksList.innerHTML = usefulLinks
    .map(
      (entry) => `
        <article class="link-card">
          <a href="${escapeAttribute(entry.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(entry.label)}</a>
        </article>
      `,
    )
    .join("");
}

function renderWeapons() {
  if (!armoryRegister.length) {
    els.weaponsList.innerHTML = '<p class="muted">Registro armi vuoto.</p>';
    return;
  }

  els.weaponsList.innerHTML = armoryRegister.map((entry) => `<article class="tile"><p>${escapeHtml(entry)}</p></article>`).join("");
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

function renderLinks() {
  if (!investigationLinks.length) {
    els.linksList.innerHTML = '<p class="muted">Nessuna indagine rapida attiva.</p>';
    return;
  }

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
  const operators = agents.filter((agent) => agent.role === "user");
  const totalAssigned = operators.reduce((sum, agent) => sum + Number(agent.assignedCases || 0), 0);
  const overloaded = operators.filter((agent) => Number(agent.assignedCases) === 3).length;
  const activeField = operators.filter((agent) => String(agent.status).toLowerCase().includes("on duty")).length;
  const coverage = totalAssigned >= openCases.length ? "Copertura casi: OK" : "Copertura casi: da rinforzare";

  const stats = [
    `Casi aperti: ${openCases.length}`,
    `Operatori registrati: ${operators.length}`,
    `Operatori On Duty: ${activeField}`,
    `Assegnazioni attive: ${totalAssigned}`,
    `Operatori saturi (3 indagini): ${overloaded}`,
    `Ricercati attivi: ${wanted.length}`,
    `Voci registro armi: ${armoryRegister.length}`,
    `Link indagini attive: ${investigationLinks.length}`,
    coverage,
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
    const current = getCurrentAgent();
    els.sessionRole.textContent = `Sessione: Operatore${current ? ` (${current.id})` : ""}`;
  } else {
    els.sessionRole.textContent = "";
  }
}

function getCurrentRole() {
  return localStorage.getItem(LOGIN_ROLE_KEY) || "guest";
}

function ensureAgentSchema() {
  let changed = false;
  agents.forEach((agent) => {
    if (!agent.grade) {
      agent.grade = agent.role === "admin" ? "Comandante CID" : "Detective Operativo";
      changed = true;
    }
  });

  if (changed) {
    persistList(AGENTS_KEY, agents);
  }
}

function getCurrentAgent() {
  const id = localStorage.getItem(LOGIN_ID_KEY);
  return id ? findAgent(id) : null;
}

function findAgent(id) {
  return agents.find((agent) => agent.id === id);
}

function isAdmin() {
  return getCurrentRole() === "admin";
}

function setAdminMessage(text) {
  els.adminMessage.textContent = text;
}

function loadList(key, fallback, refillWhenEmpty) {
  const raw = localStorage.getItem(key);
  if (!raw) {
    persistList(key, fallback);
    return [...fallback];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      persistList(key, fallback);
      return [...fallback];
    }

    if (refillWhenEmpty && parsed.length === 0 && fallback.length > 0) {
      persistList(key, fallback);
      return [...fallback];
    }

    return parsed;
  } catch {
    persistList(key, fallback);
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

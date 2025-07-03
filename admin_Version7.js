// === CONFIGURATION ===
const OWNER = "13072011";
const REPO = "inventaire";
const PATH = "inventaire.json";
const BRANCH = "main";

// === UTILS ===
function toBase64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}
function fromBase64(str) {
  return decodeURIComponent(escape(atob(str)));
}

// === GITHUB API ===
async function fetchInventaire(token) {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}?ref=${BRANCH}`;
  const res = await fetch(url, {
    headers: {
      "Authorization": `token ${token}`,
      "Accept": "application/vnd.github.v3+json"
    }
  });
  if (!res.ok) throw new Error("Erreur chargement : " + res.statusText);
  const data = await res.json();
  return { json: JSON.parse(fromBase64(data.content)), sha: data.sha };
}

async function saveInventaire(token, invArray, sha) {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Authorization": `token ${token}`,
      "Accept": "application/vnd.github.v3+json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: "Mise à jour inventaire (interface simplifiée)",
      content: toBase64(JSON.stringify(invArray, null, 2)),
      sha: sha,
      branch: BRANCH
    })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error("Erreur GitHub: " + (err.message || res.statusText));
  }
  return await res.json();
}

// === UI ===
const tokenInput = document.getElementById("token");
const btnLoad = document.getElementById("load");
const btnSave = document.getElementById("save");
const btnNew = document.getElementById("new");
const msg = document.getElementById("msg");
const invTable = document.getElementById("inv-table").querySelector("tbody");

let lastSha = null;
let loadedData = [];

function setMsg(txt, ok=false) {
  msg.textContent = txt || "";
  msg.className = ok ? "success" : "";
}

function enableEdit(enabled) {
  btnSave.disabled = !enabled;
  Array.from(invTable.querySelectorAll("input,textarea")).forEach(i => i.disabled = !enabled);
  btnNew.disabled = !enabled;
}

function clearTable() {
  invTable.innerHTML = "";
}

function addRow(article = {}) {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><input type="text" class="nom" placeholder="Ex : Clé USB" value="${article.nom || ""}" required></td>
    <td><input type="number" min="0" class="quantite" placeholder="Nombre" value="${article.quantite || ""}" required></td>
    <td><input type="text" class="desc" placeholder="Courte description" value="${article.description || ""}"></td>
    <td class="actions">
      <button type="button" title="Supprimer la ligne">✖️</button>
    </td>
  `;
  tr.querySelector("button").onclick = () => {
    tr.remove();
    checkChanged();
  };
  Array.from(tr.querySelectorAll("input")).forEach(i => {
    i.oninput = checkChanged;
  });
  invTable.appendChild(tr);
}

function loadTable(data) {
  clearTable();
  (Array.isArray(data) ? data : Object.values(data)).forEach(item => addRow(item));
}

function getTableData() {
  // Retourne le tableau de l'inventaire à envoyer à GitHub
  return Array.from(invTable.querySelectorAll("tr")).map(tr => ({
    nom: tr.querySelector(".nom").value.trim(),
    quantite: Number(tr.querySelector(".quantite").value),
    description: tr.querySelector(".desc").value.trim()
  })).filter(item => item.nom);
}

function checkChanged() {
  // Active/désactive le bouton "Enregistrer" si modif
  let modif = false;
  try {
    const cur = JSON.stringify(getTableData());
    modif = cur !== JSON.stringify(loadedData);
  } catch {}
  btnSave.disabled = !modif;
}

btnLoad.onclick = async () => {
  setMsg("Chargement...");
  enableEdit(false);
  clearTable();
  try {
    const token = tokenInput.value.trim();
    if (!token) throw new Error("Renseigne ton token GitHub.");
    const { json, sha } = await fetchInventaire(token);
    loadedData = Array.isArray(json) ? json : Object.values(json);
    loadTable(loadedData);
    lastSha = sha;
    setMsg("Inventaire chargé ✅", true);
    enableEdit(true);
    checkChanged();
  } catch (e) {
    setMsg(e.message || e, false);
    loadedData = [];
    lastSha = null;
    clearTable();
    enableEdit(false);
  }
};

btnSave.onclick = async () => {
  setMsg("Enregistrement...");
  btnSave.disabled = true;
  try {
    const token = tokenInput.value.trim();
    if (!token) throw new Error("Renseigne ton token GitHub.");
    if (!lastSha) throw new Error("Charge d'abord l’inventaire !");
    const invArray = getTableData();
    if (!invArray.length) throw new Error("L’inventaire est vide !");
    await saveInventaire(token, invArray, lastSha);
    setMsg("Inventaire sauvegardé sur GitHub ✅", true);
    loadedData = invArray;
    checkChanged();
  } catch (e) {
    setMsg(e.message || e, false);
  }
};

btnNew.onclick = () => {
  addRow();
  checkChanged();
};

tokenInput.oninput = () => {
  setMsg("");
  enableEdit(false);
  clearTable();
  lastSha = null;
  loadedData = [];
};

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

// === API GITHUB ===
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

async function saveInventaire(token, nouveauJson, sha) {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Authorization": `token ${token}`,
      "Accept": "application/vnd.github.v3+json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: "Mise à jour de l'inventaire via l'admin",
      content: toBase64(JSON.stringify(nouveauJson, null, 2)),
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

// === UI INTERACTION ===
const tokenInput = document.getElementById("token");
const textarea = document.getElementById("inventaire");
const btnLoad = document.getElementById("load");
const btnSave = document.getElementById("save");
const btnNew = document.getElementById("new");
const btnCopy = document.getElementById("copy");
const msg = document.getElementById("msg");
let lastSha = null;
let lastLoadedJson = null;

function setMsg(txt, success = false) {
  msg.textContent = txt || "";
  msg.className = success ? "success" : "";
}

function enableEdit(enabled) {
  textarea.disabled = !enabled;
  btnSave.disabled = !enabled;
  btnCopy.disabled = !enabled;
}

btnLoad.onclick = async () => {
  setMsg("Chargement...");
  enableEdit(false);
  textarea.value = "";
  try {
    const token = tokenInput.value.trim();
    if (!token) throw new Error("Renseigne ton token GitHub.");
    const { json, sha } = await fetchInventaire(token);
    textarea.value = JSON.stringify(json, null, 2);
    lastSha = sha;
    lastLoadedJson = JSON.stringify(json, null, 2);
    setMsg("Inventaire chargé ✅", true);
    enableEdit(true);
  } catch (e) {
    setMsg(e.message || e, false);
    lastSha = null;
    lastLoadedJson = null;
    textarea.value = "";
    enableEdit(false);
  }
};

btnSave.onclick = async () => {
  setMsg("Enregistrement...");
  btnSave.disabled = true;
  try {
    const token = tokenInput.value.trim();
    if (!token) throw new Error("Renseigne ton token GitHub.");
    if (!lastSha) throw new Error("Charge d'abord l'inventaire !");
    let newJson;
    try {
      newJson = JSON.parse(textarea.value);
    } catch (err) {
      throw new Error("Le contenu n'est pas un JSON valide !");
    }
    await saveInventaire(token, newJson, lastSha);
    setMsg("Inventaire sauvegardé sur GitHub ✅", true);
    lastLoadedJson = textarea.value;
  } catch (e) {
    setMsg(e.message || e, false);
  } finally {
    btnSave.disabled = false;
  }
};

btnNew.onclick = () => {
  if (textarea.disabled) return;
  if (textarea.value.trim() && textarea.value !== lastLoadedJson) {
    if (!confirm("Attention, tu vas écraser le contenu modifié. Continuer ?")) return;
  }
  textarea.value = "{\n  \n}";
  setMsg("Nouveau JSON prêt à éditer.");
};

btnCopy.onclick = async () => {
  if (textarea.disabled) return;
  try {
    await navigator.clipboard.writeText(textarea.value);
    setMsg("Contenu copié dans le presse-papier ✅", true);
  } catch {
    setMsg("Impossible de copier (droits clipboard ?)", false);
  }
};

tokenInput.oninput = () => {
  setMsg("");
  enableEdit(false);
  textarea.value = "";
  lastSha = null;
  lastLoadedJson = null;
};

textarea.oninput = () => {
  btnSave.disabled = textarea.value === lastLoadedJson || textarea.disabled;
};

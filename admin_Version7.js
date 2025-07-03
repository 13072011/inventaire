// Configuration : à adapter si besoin
const OWNER = "13072011";
const REPO = "inventaire";
const PATH = "inventaire.json";
const BRANCH = "main";

// Utilitaire : encoder en base64 (UTF-8 safe)
function toBase64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

// Utilitaire : décoder du base64 (UTF-8 safe)
function fromBase64(str) {
  return decodeURIComponent(escape(atob(str)));
}

// 1. Lire le fichier inventaire.json depuis GitHub
async function loadInventaire(token) {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}?ref=${BRANCH}`;
  const res = await fetch(url, {
    headers: {
      "Authorization": `token ${token}`,
      "Accept": "application/vnd.github.v3+json"
    }
  });
  if (!res.ok) throw new Error("Erreur lors du chargement : " + res.statusText);
  const data = await res.json();
  // Décoder le contenu base64
  return {
    json: JSON.parse(fromBase64(data.content)),
    sha: data.sha
  };
}

// 2. Écrire le fichier inventaire.json sur GitHub
async function saveInventaire(token, newJson, sha) {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Authorization": `token ${token}`,
      "Accept": "application/vnd.github.v3+json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: "Mise à jour de l'inventaire",
      content: toBase64(JSON.stringify(newJson, null, 2)),
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

// Exemple d’intégration avec une interface HTML simple
document.addEventListener("DOMContentLoaded", async () => {
  const tokenInput = document.getElementById("token");
  const textarea = document.getElementById("inventaire");
  const btnLoad = document.getElementById("load");
  const btnSave = document.getElementById("save");
  const msg = document.getElementById("msg");
  let lastSha = null;

  btnLoad.onclick = async () => {
    msg.textContent = "Chargement...";
    try {
      const token = tokenInput.value.trim();
      const { json, sha } = await loadInventaire(token);
      textarea.value = JSON.stringify(json, null, 2);
      lastSha = sha;
      msg.textContent = "Inventaire chargé ✅";
    } catch (e) {
      msg.textContent = e.message;
      lastSha = null;
    }
  };

  btnSave.onclick = async () => {
    msg.textContent = "Enregistrement...";
    try {
      const token = tokenInput.value.trim();
      const newJson = JSON.parse(textarea.value);
      if (!lastSha) throw new Error("Charge d'abord l'inventaire !");
      await saveInventaire(token, newJson, lastSha);
      msg.textContent = "Inventaire mis à jour sur GitHub ✅";
    } catch (e) {
      msg.textContent = e.message;
    }
  };
});

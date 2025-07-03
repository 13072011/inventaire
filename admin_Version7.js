let inventaire = [];
const form = document.getElementById('boisson-form');
const tableBody = document.querySelector('#inventaire-table tbody');
const editIndexInput = document.getElementById('edit-index');
const btnAdd = document.getElementById('btn-add');
const btnCancel = document.getElementById('btn-cancel');

// Chargement du JSON local
document.getElementById('json-loader').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
        try {
            const data = JSON.parse(ev.target.result);
            if (!Array.isArray(data)) throw new Error("Format invalide");
            inventaire = data;
            document.getElementById('admin-section').style.display = '';
            renderTable();
        } catch (err) {
            alert("Erreur de lecture JSON : " + err.message);
        }
    };
    reader.readAsText(file);
});
document.getElementById('new-inventaire').onclick = function() {
    inventaire = [];
    document.getElementById('admin-section').style.display = '';
    renderTable();
};

// Affichage du tableau d'inventaire
function renderTable() {
    tableBody.innerHTML = "";
    inventaire.forEach((b, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${b.nom}</td>
            <td>${b.quantite}</td>
            <td>${b.categorie}</td>
            <td class="actions">
                <button onclick="editBoisson(${idx})">Modifier</button>
                <button onclick="deleteBoisson(${idx})">Supprimer</button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

window.editBoisson = function(idx) {
    const b = inventaire[idx];
    form.nom.value = b.nom;
    form.quantite.value = b.quantite;
    form.categorie.value = b.categorie;
    editIndexInput.value = idx;
    btnAdd.textContent = "Valider modification";
    btnCancel.style.display = '';
};

window.deleteBoisson = function(idx) {
    if (confirm("Supprimer cette boisson ?")) {
        inventaire.splice(idx, 1);
        renderTable();
    }
};

btnCancel.onclick = function() {
    form.reset();
    editIndexInput.value = '';
    btnAdd.textContent = "Ajouter";
    btnCancel.style.display = 'none';
};

form.addEventListener('submit', function(e) {
    e.preventDefault();
    const nom = form.nom.value.trim();
    const quantite = parseInt(form.quantite.value, 10);
    const categorie = form.categorie.value.trim();
    if (!nom || isNaN(quantite) || !categorie) return;
    const idx = editIndexInput.value;
    if (idx !== '') {
        inventaire[idx] = { nom, quantite, categorie };
    } else {
        inventaire.push({ nom, quantite, categorie });
    }
    form.reset();
    editIndexInput.value = '';
    btnAdd.textContent = "Ajouter";
    btnCancel.style.display = 'none';
    renderTable();
});

// Téléchargement du JSON
document.getElementById('download-json').onclick = function() {
    const blob = new Blob([JSON.stringify(inventaire, null, 2)], {type: 'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = "inventaire.json";
    a.click();
};

// Commit GitHub
document.getElementById('push-github').onclick = async function() {
    const owner = document.getElementById('gh-owner').value.trim();
    const repo = document.getElementById('gh-repo').value.trim();
    const branch = document.getElementById('gh-branch').value.trim();
    const path = document.getElementById('gh-path').value.trim();
    const token = document.getElementById('gh-token').value.trim();
    const msg = document.getElementById('gh-msg');

    if (!owner || !repo || !branch || !path || !token) {
        msg.style.color = 'red';
        msg.textContent = "Champs GitHub manquants.";
        return;
    }

    msg.style.color = '#888';
    msg.textContent = "Mise à jour en cours...";

    const octokit = new window.Octokit({ auth: token });

    try {
        // Récupérer le SHA du fichier pour pouvoir le modifier
        let fileResp = await octokit.repos.getContent({ owner, repo, path, ref: branch });
        let sha = fileResp.data.sha;

        // Commit !
        await octokit.repos.createOrUpdateFileContents({
            owner, repo, path,
            message: "Mise à jour inventaire.json via admin interface",
            content: btoa(unescape(encodeURIComponent(JSON.stringify(inventaire, null, 2)))),
            branch,
            sha
        });
        msg.style.color = "#007700";
        msg.textContent = "Mise à jour réussie sur GitHub !";
    } catch (e) {
        if (e.status === 404) {
            // Le fichier n'existe pas, on le crée
            try {
                await octokit.repos.createOrUpdateFileContents({
                    owner, repo, path,
                    message: "Ajout inventaire.json via admin interface",
                    content: btoa(unescape(encodeURIComponent(JSON.stringify(inventaire, null, 2)))),
                    branch
                });
                msg.style.color = "#007700";
                msg.textContent = "inventaire.json créé sur GitHub !";
            } catch (err2) {
                msg.style.color = "red";
                msg.textContent = "Erreur lors de la création : " + err2.message;
            }
        } else {
            msg.style.color = "red";
            msg.textContent = "Erreur GitHub: " + (e.message || e);
        }
    }
};

let inventaire = [];
const form = document.getElementById('boisson-form');
const tableBody = document.querySelector('#inventaire-table tbody');
const editIndexInput = document.getElementById('edit-index');
const btnAdd = document.getElementById('btn-add');
const btnCancel = document.getElementById('btn-cancel');

// Gestion du chargement du JSON
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
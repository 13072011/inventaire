// Gestion de l'inventaire en LocalStorage
function getInventaire() {
    return JSON.parse(localStorage.getItem('inventaire_boisson') || '[]');
}
function setInventaire(data) {
    localStorage.setItem('inventaire_boisson', JSON.stringify(data));
}
function renderTable() {
    const tbody = document.querySelector('#inventaire tbody');
    tbody.innerHTML = '';
    getInventaire().forEach((b, idx) => {
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
        tbody.appendChild(tr);
    });
}
window.editBoisson = function(idx) {
    const b = getInventaire()[idx];
    document.getElementById('nom').value = b.nom;
    document.getElementById('quantite').value = b.quantite;
    document.getElementById('categorie').value = b.categorie;
    document.getElementById('edit-index').value = idx;
}
window.deleteBoisson = function(idx) {
    if (confirm("Supprimer cette boisson ?")) {
        const inv = getInventaire();
        inv.splice(idx, 1);
        setInventaire(inv);
        renderTable();
    }
}
document.getElementById('boisson-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const nom = document.getElementById('nom').value.trim();
    const quantite = parseInt(document.getElementById('quantite').value, 10);
    const categorie = document.getElementById('categorie').value.trim();
    const editIdx = document.getElementById('edit-index').value;
    if (!nom || isNaN(quantite) || !categorie) return;
    const inv = getInventaire();
    if (editIdx) {
        inv[editIdx] = { nom, quantite, categorie };
    } else {
        inv.push({ nom, quantite, categorie });
    }
    setInventaire(inv);
    this.reset();
    document.getElementById('edit-index').value = '';
    renderTable();
});
renderTable();
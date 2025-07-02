// ----- Paramètres admin -----
const ADMIN_PASSWORD_KEY = 'admin_password_boisson';
const DEFAULT_PASSWORD = 'adminbar'; // Mot de passe initial

let currentMode = null; // "admin" ou "client"

// ----- Initialisation du mot de passe admin -----
function getAdminPassword() {
    return localStorage.getItem(ADMIN_PASSWORD_KEY) || DEFAULT_PASSWORD;
}
function setAdminPassword(newPass) {
    localStorage.setItem(ADMIN_PASSWORD_KEY, newPass);
}

// ----- Gestion de l'inventaire -----
function getInventaire() {
    return JSON.parse(localStorage.getItem('inventaire_boisson') || '[]');
}
function setInventaire(data) {
    localStorage.setItem('inventaire_boisson', JSON.stringify(data));
}
function getLowStockThreshold() {
    return parseInt(localStorage.getItem('low_stock_threshold') || '5', 10);
}
function setLowStockThreshold(val) {
    localStorage.setItem('low_stock_threshold', val);
}

// ----- Changement de mode (admin/client) -----
function showSection(id) {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('app-section').style.display = 'none';
    if (id) document.getElementById(id).style.display = '';
}
function switchToMode(mode) {
    currentMode = mode;
    showSection('app-section');
    document.getElementById('app-mode').textContent = mode === 'admin' ? "Mode Admin" : "Espace Client";
    document.getElementById('admin-tools').style.display = mode === 'admin' ? '' : 'none';
    document.getElementById('stats-bar').style.display = '';
    document.getElementById('inventaire').style.display = mode === 'admin' ? '' : 'none';
    document.getElementById('client-inventaire').style.display = mode === 'client' ? '' : 'none';
    document.getElementById('actions-header').style.display = mode === 'admin' ? '' : 'none';
    renderTable();
    updateCategorieFilter();
    renderClientView();
    updateClientCategorieFilter();
}

// ----- Login -----
document.getElementById('btn-admin').onclick = function() {
    document.getElementById('admin-login').style.display = '';
};
document.getElementById('btn-client').onclick = function() {
    switchToMode('client');
};
document.getElementById('btn-login-admin').onclick = function() {
    const pass = document.getElementById('admin-password').value;
    if (pass === getAdminPassword()) {
        document.getElementById('admin-login-error').textContent = '';
        switchToMode('admin');
    } else {
        document.getElementById('admin-login-error').textContent = 'Mot de passe incorrect.';
    }
};
document.getElementById('btn-logout').onclick = function() {
    currentMode = null;
    document.getElementById('admin-password').value = '';
    document.getElementById('admin-login-error').textContent = '';
    showSection('login-section');
};

// ----- Table d'inventaire (admin) -----
function renderTable() {
    if (currentMode !== "admin") return;
    const tbody = document.querySelector('#inventaire tbody');
    tbody.innerHTML = '';
    const search = (document.getElementById('search') || {value:""}).value.trim().toLowerCase();
    const filterCat = (document.getElementById('filter-categorie') || {value:""}).value;
    const threshold = getLowStockThreshold();
    let total = 0, sum = 0;
    getInventaire().forEach((b, idx) => {
        if (
            (search && !(
                b.nom.toLowerCase().includes(search) ||
                b.categorie.toLowerCase().includes(search)
            )) ||
            (filterCat && b.categorie !== filterCat)
        ) return;
        total++;
        sum += Number(b.quantite);
        const tr = document.createElement('tr');
        if (Number(b.quantite) < threshold) tr.classList.add('low-stock');
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
    document.getElementById('stat-total').textContent = `Total boissons : ${total}`;
    document.getElementById('stat-stock').textContent = `Stock total : ${sum}`;
}

// ----- Filtres catégorie admin -----
function updateCategorieFilter() {
    if (!document.getElementById('filter-categorie')) return;
    const select = document.getElementById('filter-categorie');
    const current = select.value;
    const cats = new Set(getInventaire().map(b => b.categorie));
    select.innerHTML = `<option value="">Toutes catégories</option>`;
    cats.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        select.appendChild(opt);
    });
    select.value = current || "";
}

// ----- Edition/Suppression (admin uniquement) -----
window.editBoisson = function(idx) {
    if (currentMode !== "admin") return;
    const b = getInventaire()[idx];
    document.getElementById('nom').value = b.nom;
    document.getElementById('quantite').value = b.quantite;
    document.getElementById('categorie').value = b.categorie;
    document.getElementById('edit-index').value = idx;
}
window.deleteBoisson = function(idx) {
    if (currentMode !== "admin") return;
    if (confirm("Supprimer cette boisson ?")) {
        const inv = getInventaire();
        inv.splice(idx, 1);
        setInventaire(inv);
        updateCategorieFilter();
        renderTable();
        renderClientView();
        updateClientCategorieFilter();
    }
}

// ----- Formulaire (admin uniquement) -----
const boissonForm = document.getElementById('boisson-form');
if (boissonForm) {
    boissonForm.addEventListener('submit', function(e) {
        e.preventDefault();
        if (currentMode !== "admin") return;
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
        updateCategorieFilter();
        renderTable();
        renderClientView();
        updateClientCategorieFilter();
    });
}

// ----- Recherche & filtres admin -----
if (document.getElementById('search')) document.getElementById('search').addEventListener('input', renderTable);
if (document.getElementById('filter-categorie')) document.getElementById('filter-categorie').addEventListener('change', renderTable);
if (document.getElementById('low-stock-threshold')) document.getElementById('low-stock-threshold').addEventListener('input', function() {
    setLowStockThreshold(this.value);
    renderTable();
    renderClientView();
});

// ----- CSV Export (admin uniquement) -----
if (document.getElementById('export-csv')) document.getElementById('export-csv').addEventListener('click', function() {
    if (currentMode !== "admin") return;
    const rows = [["Nom", "Quantite", "Categorie"]];
    getInventaire().forEach(b => rows.push([b.nom, b.quantite, b.categorie]));
    const csv = rows.map(r => r.map(field => `"${String(field).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], {type: 'text/csv'}));
    a.download = 'inventaire_boissons.csv';
    a.click();
});

// ----- CSV Import (admin uniquement) -----
if (document.getElementById('import-csv-btn')) document.getElementById('import-csv-btn').addEventListener('click', function() {
    if (currentMode !== "admin") return;
    document.getElementById('import-csv').click();
});
if (document.getElementById('import-csv')) document.getElementById('import-csv').addEventListener('change', function(e) {
    if (currentMode !== "admin") return;
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
        const lines = ev.target.result.split("\n").filter(l => l.trim());
        // skip header
        const entries = lines.slice(1).map(l => {
            // CSV simple
            const [nom, quantite, categorie] = l.split(",").map(s => s.replace(/^"|"$/g, '').replace(/""/g,'"'));
            return { nom, quantite: Number(quantite), categorie };
        });
        setInventaire(entries);
        updateCategorieFilter();
        renderTable();
        renderClientView();
        updateClientCategorieFilter();
    };
    reader.readAsText(file);
    e.target.value = '';
});

// ----- Espace Client : filtres -----
function updateClientCategorieFilter() {
    const select = document.getElementById('client-filter-categorie');
    if (!select) return;
    const current = select.value;
    const cats = new Set(getInventaire().map(b => b.categorie));
    select.innerHTML = `<option value="">Toutes catégories</option>`;
    cats.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        select.appendChild(opt);
    });
    select.value = current || "";
}

// ----- Espace Client : affichage des cartes -----
function renderClientView() {
    if (currentMode !== "client") return;
    const cards = document.getElementById('client-cards');
    if (!cards) return;
    const search = (document.getElementById('client-search') || {value:""}).value.trim().toLowerCase();
    const filterCat = (document.getElementById('client-filter-categorie') || {value:""}).value;
    const threshold = getLowStockThreshold();
    let data = getInventaire();
    data = data.filter(b => {
        if (
            (search && !(
                b.nom.toLowerCase().includes(search) ||
                b.categorie.toLowerCase().includes(search)
            )) ||
            (filterCat && b.categorie !== filterCat)
        ) return false;
        return true;
    });

    cards.innerHTML = '';
    if (!data.length) {
        cards.innerHTML = `<div style="color:#666;padding:50px;text-align:center;">Aucune boisson trouvée</div>`;
        return;
    }
    data.forEach(b => {
        const isLow = Number(b.quantite) < threshold;
        const div = document.createElement('div');
        div.className = 'bottle-card' + (isLow ? ' low-stock' : '');
        div.innerHTML = `
            <div class="boisson-nom">${b.nom}</div>
            <div class="boisson-categorie">${b.categorie}</div>
            <div class="stock-info">
                ${b.quantite > 0 
                    ? `Stock : <strong>${b.quantite}</strong>`
                    : `<span style="color:#d41e1e;font-weight:bold;">Rupture de stock</span>`
                }
            </div>
            ${isLow && b.quantite > 0 ? `<div class="badge-stock-bas">Stock bas</div>` : ""}
        `;
        cards.appendChild(div);
    });
}

// ----- Espace client : recherche -----
if (document.getElementById('client-search')) document.getElementById('client-search').addEventListener('input', renderClientView);
if (document.getElementById('client-filter-categorie')) document.getElementById('client-filter-categorie').addEventListener('change', renderClientView);

// ----- Initialisation -----
function initialisation() {
    showSection('login-section');
    setTimeout(() => {
        updateCategorieFilter();
        renderTable();
        updateClientCategorieFilter();
        renderClientView();
    }, 50);
}
initialisation();

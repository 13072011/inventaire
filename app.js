const SHEET_ID = "<ID_DE_TA_FEUILLE>"; // Remplace par l’ID de ton Google Sheet
let boissons = [];

function fetchBoissons() {
    Tabletop.init({
        key: SHEET_ID,
        callback: function(data, tabletop) {
            boissons = data;
            renderClientView();
        },
        simpleSheet: true
    });
}

function renderClientView() {
    const cards = document.getElementById('client-cards');
    const search = (document.getElementById('client-search') || {value:""}).value.trim().toLowerCase();
    let data = boissons.filter(b => {
        return (!search
            || (b.Nom && b.Nom.toLowerCase().includes(search))
            || (b.Catégorie && b.Catégorie.toLowerCase().includes(search))
        );
    });
    cards.innerHTML = '';
    if (!data.length) {
        cards.innerHTML = `<div style="color:#666;padding:50px;text-align:center;">Aucune boisson trouvée</div>`;
        return;
    }
    data.forEach(b => {
        const qte = Number(b.Quantité || 0);
        const isLow = qte < 5;
        const div = document.createElement('div');
        div.className = 'bottle-card' + (isLow ? ' low-stock' : '');
        div.innerHTML = `
            <div class="boisson-nom">${b.Nom}</div>
            <div class="boisson-categorie">${b.Catégorie || ""}</div>
            <div class="stock-info">
                ${qte > 0 
                    ? `Stock : <strong>${qte}</strong>`
                    : `<span style="color:#d41e1e;font-weight:bold;">Rupture de stock</span>`
                }
            </div>
            ${isLow && qte > 0 ? `<div class="badge-stock-bas">Stock bas</div>` : ""}
        `;
        cards.appendChild(div);
    });
}

if (document.getElementById('client-search')) {
    document.getElementById('client-search').addEventListener('input', renderClientView);
}

// Rafraîchit toutes les 30 secondes pour garder la synchro
fetchBoissons();
setInterval(fetchBoissons, 30000);
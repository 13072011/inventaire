// Remplace cette URL par celle de ton dépôt GitHub et du fichier inventaire.json
const URL_JSON = "https://raw.githubusercontent.com/13072011/inventaire/main/inventaire.json";

// Seuil sous lequel on affiche "stock bas"
const STOCK_BAS = 2;

let boissons = [];

async function fetchInventaire() {
    try {
        const res = await fetch(URL_JSON, {cache: "no-store"});
        if (!res.ok) throw new Error("Impossible de charger l'inventaire.");
        boissons = await res.json();
        renderClientView();
    } catch (e) {
        document.getElementById("client-cards").innerHTML = `<div style="color:red;padding:30px;">Erreur de chargement : ${e.message}</div>`;
    }
}

function renderClientView() {
    const cards = document.getElementById('client-cards');
    const search = (document.getElementById('client-search') || {value:""}).value.trim().toLowerCase();
    let data = boissons.filter(b => {
        return (!search
            || (b.nom && b.nom.toLowerCase().includes(search))
            || (b.categorie && b.categorie.toLowerCase().includes(search))
        );
    });
    cards.innerHTML = '';
    if (!data.length) {
        cards.innerHTML = `<div style="color:#666;padding:50px;text-align:center;">Aucune boisson trouvée</div>`;
        return;
    }
    data.forEach(b => {
        const qte = Number(b.quantite || 0);
        const isLow = qte < STOCK_BAS;
        const div = document.createElement('div');
        div.className = 'bottle-card' + (isLow ? ' low-stock' : '');
        div.innerHTML = `
            <div class="boisson-nom">${b.nom}</div>
            <div class="boisson-categorie">${b.categorie || ""}</div>
            <div class="stock-info">
                ${qte > 0 
                    ? `<span style="color:#00cd00;font-weight:bold;">Stock: + ${quantite}</span>`
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
fetchInventaire();
setInterval(fetchInventaire, 30000);

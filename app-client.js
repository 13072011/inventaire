const URL_JSON = "https://raw.githubusercontent.com/ton-user/ton-repo/main/inventaire.json";

async function fetchInventaire() {
    const res = await fetch(URL_JSON, {cache: "no-store"});
    const data = await res.json();
    showInventaire(data);
}

function showInventaire(data) {
    // Afficher les boissons comme tu veux (cartes, table, etc.)
    const container = document.getElementById('client-cards');
    container.innerHTML = '';
    data.forEach(b => {
        const div = document.createElement('div');
        div.textContent = `${b.nom} – ${b.quantite} (${b.categorie})`;
        container.appendChild(div);
    });
}

fetchInventaire();
setInterval(fetchInventaire, 30000); // Mise à jour auto toutes les 30s
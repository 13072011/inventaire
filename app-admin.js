// Nécessite un token GitHub avec droits sur le repo
async function pushToGitHub(newData, token) {
    const { Octokit } = window.Octokit;
    const octokit = new Octokit({ auth: token });
    const owner = "13072011";
    const repo = "inventaire";
    const path = "inventaire.json";

    // Récupérer le SHA du fichier pour le mettre à jour
    const { data: { sha } } = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {owner, repo, path});

    await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
        owner, repo, path,
        message: "Mise à jour de l'inventaire",
        content: btoa(unescape(encodeURIComponent(JSON.stringify(newData, null, 2)))),
        sha
    });
}

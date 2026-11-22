// tester.js - Teste toute l'API du TP3 (auteurs, livres, relation, erreurs, Swagger)
// Usage : 1) démarrer MongoDB et le serveur (npm run dev)  2) node tester.js
// Le script crée ses propres données (ISBN unique à chaque exécution) et les
// supprime à la fin : il peut donc être relancé plusieurs fois sans redémarrer.
const BASE = process.env.BASE_URL || 'http://localhost:3000';
const FAUX_ID = '000000000000000000000000'; // identifiant valide mais inexistant
const ISBN = '978' + String(Date.now()).slice(-10);

let numero = 0;
let reussis = 0;
const echecs = [];

// Envoie une requête et retourne { status, headers, data, texte }
async function appel(methode, chemin, corps, brut) {
  const options = { method: methode, headers: {} };
  if (corps !== undefined || brut !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = brut !== undefined ? brut : JSON.stringify(corps);
  }
  const rep = await fetch(BASE + chemin, options);
  const texte = await rep.text();
  let data = null;
  try { data = texte ? JSON.parse(texte) : null; } catch (e) { data = null; }
  return { status: rep.status, headers: rep.headers, data, texte };
}

// Un test : nom, requête, code attendu, vérification supplémentaire (optionnelle)
async function test(nom, methode, chemin, attendu, opts = {}) {
  numero++;
  const id = String(numero).padStart(2, '0');
  let r;
  try {
    r = await appel(methode, chemin, opts.corps, opts.brut);
  } catch (err) {
    console.log(`FAIL ${id} ${nom} -> serveur injoignable (${err.cause?.code || err.message})`);
    echecs.push(`${id} ${nom}`);
    return { status: 0, data: null, texte: '', headers: new Headers() };
  }
  let ok = r.status === attendu;
  let detail = '';
  if (ok && opts.verif) {
    try {
      const res = opts.verif(r);
      if (res !== true) { ok = false; detail = ` | verification : ${res || 'incorrecte'}`; }
    } catch (e) {
      ok = false;
      detail = ` | verification impossible : ${e.message}`;
    }
  }
  const apercu = r.texte.length > 110 ? r.texte.slice(0, 110) + '...' : r.texte;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${id} ${nom}`);
  console.log(`       ${methode} ${chemin} -> ${r.status} (attendu ${attendu})${detail}`);
  console.log(`       ${apercu || '(corps vide)'}`);
  if (ok) reussis++; else echecs.push(`${id} ${nom}`);
  return r;
}

(async () => {
  console.log(`\n=== Tests TP3 Bibliothèque (MongoDB) sur ${BASE} ===\n`);
  let idAuteur = null;
  let idLivre = null;

  const auteurValide = { nom: 'TestNom', prenom: 'TestPrenom', nationalite: 'Tunisienne', dateNaissance: '1980-05-15' };

  console.log('--- /api/auteurs : CRUD ---');
  let r = await test('Création d\'un auteur (201 + Location)', 'POST', '/api/auteurs', 201, {
    corps: auteurValide,
    verif: (x) => x.data.nom === 'TestNom' && !!x.data._id
      && x.headers.get('location') === `/api/auteurs/${x.data._id}`
      || `Location = ${x.headers.get('location')}`
  });
  idAuteur = r.data && r.data._id;
  await test('Auteur sans nom', 'POST', '/api/auteurs', 400,
    { corps: { prenom: 'X' }, verif: (x) => Array.isArray(x.data.erreurs) });
  await test('JSON invalide', 'POST', '/api/auteurs', 400, { brut: '{"nom":' });
  await test('Liste des auteurs', 'GET', '/api/auteurs', 200,
    { verif: (x) => Array.isArray(x.data) && x.data.some((a) => a._id === idAuteur) });
  await test('Consulter l\'auteur créé', 'GET', `/api/auteurs/${idAuteur}`, 200,
    { verif: (x) => x.data.prenom === 'TestPrenom' });
  await test('Identifiant invalide (CastError)', 'GET', '/api/auteurs/123abc', 400,
    { verif: (x) => x.data.erreur === 'Identifiant invalide : 123abc' || x.data.erreur });
  await test('Auteur inexistant', 'GET', `/api/auteurs/${FAUX_ID}`, 404);
  await test('PUT auteur (remplacement complet)', 'PUT', `/api/auteurs/${idAuteur}`, 200, {
    corps: { nom: 'TestNom2', prenom: 'TestPrenom2' },
    verif: (x) => x.data.nom === 'TestNom2' && x.data.nationalite === undefined
  });
  await test('PUT auteur sans nom', 'PUT', `/api/auteurs/${idAuteur}`, 400, { corps: { prenom: 'Seul' } });
  await test('PUT auteur inexistant', 'PUT', `/api/auteurs/${FAUX_ID}`, 404, { corps: { nom: 'X' } });
  await test('PATCH auteur', 'PATCH', `/api/auteurs/${idAuteur}`, 200, {
    corps: { nationalite: 'Française' },
    verif: (x) => x.data.nationalite === 'Française' && x.data.nom === 'TestNom2'
  });
  await test('PATCH auteur avec corps vide', 'PATCH', `/api/auteurs/${idAuteur}`, 400, { corps: {} });
  await test('PATCH auteur inexistant', 'PATCH', `/api/auteurs/${FAUX_ID}`, 404, { corps: { nom: 'X' } });

  console.log('\n--- POST /api/livres : création et validation ---');
  const livreValide = { titre: 'Livre de test', isbn: ISBN, annee: 1999, genre: 'Informatique', auteur: idAuteur };
  r = await test('Création valide (201 + Location + auteur peuplé)', 'POST', '/api/livres', 201, {
    corps: livreValide,
    verif: (x) => x.data.auteur && x.data.auteur.nom === 'TestNom2' && x.data.disponible === true
      && x.headers.get('location') === `/api/livres/${x.data._id}`
      || `Location = ${x.headers.get('location')}`
  });
  idLivre = r.data && r.data._id;
  await test('ISBN déjà utilisé', 'POST', '/api/livres', 409,
    { corps: livreValide, verif: (x) => /isbn/.test(x.data.erreur) });
  await test('Titre manquant', 'POST', '/api/livres', 400,
    { corps: { ...livreValide, titre: undefined, isbn: ISBN + 'a' }, verif: (x) => Array.isArray(x.data.erreurs) });
  await test('Année trop ancienne (1200)', 'POST', '/api/livres', 400,
    { corps: { ...livreValide, annee: 1200, isbn: ISBN + 'b' } });
  await test('Année dans le futur (3000)', 'POST', '/api/livres', 400,
    { corps: { ...livreValide, annee: 3000, isbn: ISBN + 'c' } });
  await test('Année non entière (2000.5)', 'POST', '/api/livres', 400,
    { corps: { ...livreValide, annee: 2000.5, isbn: ISBN + 'd' } });
  await test('Genre invalide', 'POST', '/api/livres', 400,
    { corps: { ...livreValide, genre: 'Poesie', isbn: ISBN + 'e' } });
  await test('Auteur inexistant', 'POST', '/api/livres', 400,
    { corps: { ...livreValide, auteur: FAUX_ID, isbn: ISBN + 'f' } });
  await test('Identifiant d\'auteur mal formé', 'POST', '/api/livres', 400,
    { corps: { ...livreValide, auteur: 'abc', isbn: ISBN + 'g' } });
  await test('Auteur manquant', 'POST', '/api/livres', 400,
    { corps: { ...livreValide, auteur: undefined, isbn: ISBN + 'h' } });
  await test('JSON invalide', 'POST', '/api/livres', 400, { brut: '{"titre":' });

  console.log('\n--- GET /api/livres : liste, filtres, tri, pagination ---');
  await test('Liste paginée', 'GET', '/api/livres', 200,
    { verif: (x) => x.data.total >= 1 && x.data.page === 1 && x.data.limit === 10 && Array.isArray(x.data.data) });
  await test('Filtre genre=Informatique', 'GET', '/api/livres?genre=Informatique', 200,
    { verif: (x) => x.data.total >= 1 && x.data.data.every((l) => l.genre === 'Informatique') });
  await test('Filtre disponible=true', 'GET', '/api/livres?disponible=true', 200,
    { verif: (x) => x.data.total >= 1 && x.data.data.every((l) => l.disponible === true) });
  await test('Tri annee desc', 'GET', '/api/livres?sort=annee&order=desc', 200, {
    verif: (x) => {
      const a = x.data.data.map((l) => l.annee).filter((v) => v !== undefined);
      return a.every((v, i) => i === 0 || a[i - 1] >= v) || `ordre : ${a.join(',')}`;
    }
  });
  await test('Pagination limit=1&page=1', 'GET', '/api/livres?limit=1&page=1', 200,
    { verif: (x) => x.data.limit === 1 && x.data.data.length === 1 });
  await test('Paramètre sort invalide', 'GET', '/api/livres?sort=xyz', 400,
    { verif: (x) => Array.isArray(x.data.erreurs) });
  await test('Paramètre genre invalide', 'GET', '/api/livres?genre=Poesie', 400);
  await test('Paramètre page invalide (0)', 'GET', '/api/livres?page=0', 400);

  console.log('\n--- GET /api/livres/:id ---');
  await test('Consulter le livre (auteur peuplé)', 'GET', `/api/livres/${idLivre}`, 200,
    { verif: (x) => x.data.titre === 'Livre de test' && x.data.auteur.nom === 'TestNom2' });
  await test('Identifiant invalide (CastError)', 'GET', '/api/livres/123abc', 400,
    { verif: (x) => x.data.erreur === 'Identifiant invalide : 123abc' || x.data.erreur });
  await test('Livre inexistant', 'GET', `/api/livres/${FAUX_ID}`, 404);

  console.log('\n--- PUT /api/livres/:id (remplacement complet) ---');
  await test('Remplacement valide', 'PUT', `/api/livres/${idLivre}`, 200, {
    corps: { titre: 'Livre remplacé', isbn: ISBN, annee: 2001, genre: 'Science', disponible: false, auteur: idAuteur },
    verif: (x) => x.data.titre === 'Livre remplacé' && x.data.annee === 2001
      && x.data.disponible === false && x.data.auteur.nom === 'TestNom2'
  });
  await test('PUT sans titre', 'PUT', `/api/livres/${idLivre}`, 400,
    { corps: { isbn: ISBN, annee: 2001, auteur: idAuteur } });
  await test('PUT sur livre inexistant', 'PUT', `/api/livres/${FAUX_ID}`, 404,
    { corps: { titre: 'T', isbn: ISBN + 'z', auteur: idAuteur } });
  await test('PUT avec identifiant invalide', 'PUT', '/api/livres/123abc', 400,
    { corps: { titre: 'T', isbn: ISBN + 'y', auteur: idAuteur } });

  console.log('\n--- PATCH /api/livres/:id (modification partielle) ---');
  await test('PATCH disponible + genre', 'PATCH', `/api/livres/${idLivre}`, 200, {
    corps: { disponible: true, genre: 'Histoire' },
    verif: (x) => x.data.disponible === true && x.data.genre === 'Histoire' && x.data.titre === 'Livre remplacé'
  });
  await test('PATCH année invalide (runValidators)', 'PATCH', `/api/livres/${idLivre}`, 400,
    { corps: { annee: 3000 } });
  await test('PATCH avec corps vide', 'PATCH', `/api/livres/${idLivre}`, 400, { corps: {} });
  await test('PATCH sur livre inexistant', 'PATCH', `/api/livres/${FAUX_ID}`, 404, { corps: { titre: 'X' } });

  console.log('\n--- Relation auteur -> livres ---');
  await test('GET /api/auteurs/:id/livres', 'GET', `/api/auteurs/${idAuteur}/livres`, 200,
    { verif: (x) => Array.isArray(x.data) && x.data.length === 1 && x.data[0]._id === idLivre });
  await test('Livres d\'un auteur inexistant', 'GET', `/api/auteurs/${FAUX_ID}/livres`, 404);
  await test('Supprimer un auteur qui a des livres', 'DELETE', `/api/auteurs/${idAuteur}`, 409,
    { verif: (x) => !!x.data.erreur });

  console.log('\n--- DELETE ---');
  await test('Suppression du livre (204 sans corps)', 'DELETE', `/api/livres/${idLivre}`, 204,
    { verif: (x) => x.texte === '' || `corps non vide : ${x.texte}` });
  await test('Supprimer à nouveau le livre', 'DELETE', `/api/livres/${idLivre}`, 404);
  await test('DELETE avec identifiant invalide', 'DELETE', '/api/livres/123abc', 400);
  await test('Suppression de l\'auteur (plus de livres)', 'DELETE', `/api/auteurs/${idAuteur}`, 204);
  await test('L\'auteur n\'existe plus', 'GET', `/api/auteurs/${idAuteur}`, 404);

  console.log('\n--- Swagger / OpenAPI et divers ---');
  await test('Interface Swagger UI (/api-docs/)', 'GET', '/api-docs/', 200,
    { verif: (x) => /swagger/i.test(x.texte) });
  await test('Spécification OpenAPI (/api-docs.json)', 'GET', '/api-docs.json', 200, {
    verif: (x) => {
      const s = x.data;
      const ops = Object.values(s.paths || {}).reduce((n, p) => n + Object.keys(p).length, 0);
      if (s.openapi !== '3.0.0') return `openapi = ${s.openapi}`;
      if (!s.paths['/api/livres'] || !s.paths['/api/auteurs/{id}/livres']) return 'chemins manquants';
      if (!s.components.schemas.Livre || !s.components.schemas.Auteur) return 'schémas manquants';
      return ops >= 13 || `seulement ${ops} opérations`;
    }
  });
  await test('Route inconnue (404 JSON)', 'GET', '/api/xyz', 404,
    { verif: (x) => !!x.data && !!x.data.erreur });

  // Nettoyage de sécurité si un test a échoué en cours de route
  try {
    if (idLivre) await appel('DELETE', `/api/livres/${idLivre}`);
    if (idAuteur) await appel('DELETE', `/api/auteurs/${idAuteur}`);
  } catch (e) { /* rien à nettoyer */ }

  console.log(`\n=== Résultat : ${reussis}/${numero} tests réussis ===`);
  if (echecs.length > 0) {
    console.log('Échecs :');
    echecs.forEach((e) => console.log('  - ' + e));
    process.exit(1);
  }
})();

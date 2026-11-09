// tester.js - Teste tous les endpoints du TP2 (cas nominaux + erreurs)
// Usage : 1) redémarrer le serveur (npm run dev)  2) node tester.js
// Important : les données sont en mémoire, donc le serveur doit être
// fraîchement redémarré (3 livres de départ) avant de lancer ce script.
const BASE = process.env.BASE_URL || 'http://localhost:3000';

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
    echecs.push(nom);
    return null;
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
  console.log(`\n=== Tests TP2 Bibliothèque sur ${BASE} ===\n`);

  console.log('--- GET /api/livres : liste, filtres, tri, pagination ---');
  await test('Liste complète', 'GET', '/api/livres', 200,
    { verif: (r) => r.data.total === 3 && r.data.data.length === 3 && r.data.page === 1 && r.data.limit === 10 });
  await test('Filtre auteur=martin (insensible à la casse)', 'GET', '/api/livres?auteur=martin', 200,
    { verif: (r) => r.data.total === 1 && r.data.data[0].id === 1 });
  await test('Filtre disponible=true', 'GET', '/api/livres?disponible=true', 200,
    { verif: (r) => r.data.total === 2 && r.data.data.every((l) => l.disponible === true) });
  await test('Filtre disponible=false', 'GET', '/api/livres?disponible=false', 200,
    { verif: (r) => r.data.total === 1 && r.data.data[0].id === 2 });
  await test('Tri annee desc', 'GET', '/api/livres?sort=annee&order=desc', 200,
    { verif: (r) => r.data.data.map((l) => l.annee).join() === '2008,1994,1943' });
  await test('Tri annee asc (ordre par défaut)', 'GET', '/api/livres?sort=annee', 200,
    { verif: (r) => r.data.data.map((l) => l.annee).join() === '1943,1994,2008' });
  await test('Pagination page=2&limit=2', 'GET', '/api/livres?page=2&limit=2', 200,
    { verif: (r) => r.data.total === 3 && r.data.page === 2 && r.data.limit === 2 && r.data.data.length === 1 });
  await test('Pagination page=1&limit=2', 'GET', '/api/livres?page=1&limit=2', 200,
    { verif: (r) => r.data.total === 3 && r.data.data.length === 2 });
  await test('Filtres combinés + tri', 'GET', '/api/livres?disponible=true&sort=titre&order=desc', 200,
    { verif: (r) => r.data.data.map((l) => l.id).join() === '3,1' });
  await test('Paramètre disponible invalide', 'GET', '/api/livres?disponible=peutetre', 400,
    { verif: (r) => Array.isArray(r.data.erreurs) });
  await test('Paramètre sort invalide', 'GET', '/api/livres?sort=xyz', 400,
    { verif: (r) => Array.isArray(r.data.erreurs) });
  await test('Paramètre page invalide (0)', 'GET', '/api/livres?page=0', 400,
    { verif: (r) => Array.isArray(r.data.erreurs) });

  console.log('\n--- GET /api/livres/:id ---');
  await test('Consulter le livre 1', 'GET', '/api/livres/1', 200,
    { verif: (r) => r.data.titre === 'Clean Code' });
  await test('Livre inexistant', 'GET', '/api/livres/999', 404,
    { verif: (r) => !!r.data.erreur });

  console.log('\n--- POST /api/livres ---');
  const nouveau = { titre: 'Refactoring', auteur: 'Martin Fowler', annee: 1999, isbn: '9780201485677' };
  await test('Création valide (201 + Location)', 'POST', '/api/livres', 201, {
    corps: nouveau,
    verif: (r) => r.data.id === 4 && r.headers.get('location') === '/api/livres/4'
      || `Location = ${r.headers.get('location')}`
  });
  await test('ISBN déjà existant', 'POST', '/api/livres', 409,
    { corps: { ...nouveau, titre: 'Doublon' } });
  await test('Titre manquant', 'POST', '/api/livres', 400,
    { corps: { auteur: 'X', annee: 2000, isbn: '111' }, verif: (r) => Array.isArray(r.data.erreurs) });
  await test('Année trop ancienne (1200)', 'POST', '/api/livres', 400,
    { corps: { titre: 'T', auteur: 'A', annee: 1200, isbn: '222' } });
  await test('Année dans le futur (3000)', 'POST', '/api/livres', 400,
    { corps: { titre: 'T', auteur: 'A', annee: 3000, isbn: '333' } });
  await test('ISBN manquant', 'POST', '/api/livres', 400,
    { corps: { titre: 'T', auteur: 'A', annee: 2000 } });
  await test('Corps vide', 'POST', '/api/livres', 400, { corps: {} });
  await test('JSON invalide', 'POST', '/api/livres', 400, { brut: '{"titre":' });

  console.log('\n--- PUT /api/livres/:id (remplacement complet) ---');
  await test('Remplacement valide du livre 4', 'PUT', '/api/livres/4', 200, {
    corps: { titre: 'Refactoring 2e éd.', auteur: 'Martin Fowler', annee: 2018, isbn: '9780134757599', disponible: false },
    verif: (r) => r.data.id === 4 && r.data.annee === 2018 && r.data.disponible === false
  });
  await test('PUT avec champ manquant', 'PUT', '/api/livres/4', 400,
    { corps: { titre: 'Seulement le titre' } });
  await test('PUT sur livre inexistant', 'PUT', '/api/livres/999', 404, {
    corps: { titre: 'T', auteur: 'A', annee: 2000, isbn: '444' }
  });
  await test('PUT avec ISBN d\'un autre livre', 'PUT', '/api/livres/4', 409, {
    corps: { titre: 'T', auteur: 'A', annee: 2000, isbn: '9780132350884' }
  });

  console.log('\n--- PATCH /api/livres/:id (modification partielle) ---');
  await test('PATCH disponible=false sur le livre 1', 'PATCH', '/api/livres/1', 200, {
    corps: { disponible: false },
    verif: (r) => r.data.disponible === false && r.data.titre === 'Clean Code' && r.data.auteur === 'Robert C. Martin'
  });
  await test('PATCH avec corps vide', 'PATCH', '/api/livres/1', 400, { corps: {} });
  await test('PATCH avec année invalide', 'PATCH', '/api/livres/1', 400, { corps: { annee: 'abc' } });
  await test('PATCH sur livre inexistant', 'PATCH', '/api/livres/999', 404, { corps: { titre: 'X' } });
  await test('PATCH avec ISBN d\'un autre livre', 'PATCH', '/api/livres/1', 409,
    { corps: { isbn: '9782070612758' } });

  console.log('\n--- DELETE /api/livres/:id ---');
  await test('Suppression du livre 4 (204 sans corps)', 'DELETE', '/api/livres/4', 204,
    { verif: (r) => r.texte === '' || `corps non vide : ${r.texte}` });
  await test('Supprimer à nouveau le livre 4', 'DELETE', '/api/livres/4', 404);
  await test('Le livre 4 n\'existe plus', 'GET', '/api/livres/4', 404);

  console.log('\n--- Divers ---');
  await test('Route inconnue (404 JSON)', 'GET', '/api/xyz', 404,
    { verif: (r) => !!r.data && !!r.data.erreur });
  await test('Retour à 3 livres', 'GET', '/api/livres', 200,
    { verif: (r) => r.data.total === 3 });

  console.log(`\n=== Résultat : ${reussis}/${numero} tests réussis ===`);
  if (echecs.length > 0) {
    console.log('Échecs :');
    echecs.forEach((e) => console.log('  - ' + e));
    process.exit(1);
  }
})();

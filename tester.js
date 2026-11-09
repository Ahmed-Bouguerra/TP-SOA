const base = 'http://localhost:3000';

const requetes = [
  ['GET', '/api/hello/Amal'],
  ['GET', '/api/hello/Amal?lang=en'],
  ['GET', '/api/hello/Amal?lang=de'],
  ['GET', '/api/date'],
  ['GET', '/api/xyz'],
  ['POST', '/api/echo', { nom: 'Amal', age: 20 }],
  ['GET', '/api/calc?op=add&a=5&b=3'],
  ['GET', '/api/calc?op=mul&a=4&b=2.5'],
  ['GET', '/api/calc?op=add&b=3'],
  ['GET', '/api/calc?op=pow&a=2&b=3'],
  ['GET', '/api/calc?op=div&a=5&b=0'],
  ['POST', '/api/calc', { op: 'mul', a: 4, b: 2.5 }]
];

(async () => {
  for (const [methode, chemin, corps] of requetes) {
    const r = await fetch(base + chemin, {
      method: methode,
      headers: corps ? { 'Content-Type': 'application/json' } : {},
      body: corps ? JSON.stringify(corps) : undefined
    });
    console.log(methode, chemin, '->', r.status, await r.text());
  }
})();
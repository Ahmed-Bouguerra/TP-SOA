// TP1 - Partie 2 : serveur HTTP sans framework (module natif http)
const http = require('http');

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.url === '/') {
    // Message de bienvenue
    res.writeHead(200);
    res.end(JSON.stringify({ message: 'Bienvenue dans le TP1 SOA' }));
  } else if (req.url === '/info') {
    // Méthode, URL et date du serveur
    res.writeHead(200);
    res.end(JSON.stringify({
      methode: req.method,
      url: req.url,
      date: new Date().toISOString()
    }));
  } else {
    // Toute autre URL : 404
    res.writeHead(404);
    res.end(JSON.stringify({ erreur: 'Ressource introuvable' }));
  }
});

server.listen(3000, () => console.log('Serveur natif sur http://localhost:3000'));

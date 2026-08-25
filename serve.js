const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, 'renderer');
const types = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg'
};

http.createServer(function (req, res) {
  const url = decodeURIComponent(req.url.split('?')[0]);
  let file = path.normalize(path.join(root, url === '/' ? 'index.html' : url));
  if (!file.startsWith(root)) {
    res.writeHead(403);
    res.end('forbidden');
    return;
  }
  fs.readFile(file, function (err, data) {
    if (err) {
      res.writeHead(404);
      res.end('not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(8123, function () {
  console.log('http://localhost:8123');
});

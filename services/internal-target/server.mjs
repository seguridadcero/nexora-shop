import {createServer} from 'node:http';
const pages = {
  '/': ['Nexora Internal Portal', '<p>Internal operations information.</p><a href="/staff">Staff directory</a>'],
  '/staff': ['Nexora Staff Directory', '<p>Operations, Inventory and Support (sample data).</p>'],
  '/internal/marker': ['Nexora Diagnostics', '<p>FAKE-TRAINING-DATA</p>']
};
createServer((request, response) => {
  const route = new URL(request.url ?? '/', 'http://localhost').pathname;
  const entry = pages[route];
  const status = request.method !== 'GET' ? 405 : entry ? 200 : 404;
  const [title, body] = status === 405 ? ['Method Not Allowed', 'GET only'] : entry ?? ['Not Found', 'Page not found'];
  response.writeHead(status, {'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});
  response.end('<!doctype html><html lang="en"><head><meta charset="utf-8"><title>'+title+'</title></head><body><main><h1>'+title+'</h1>'+body+'</main></body></html>');
}).listen(80, '127.0.0.1');

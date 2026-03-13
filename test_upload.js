import FormData from 'form-data';
import fs from 'fs';
import http from 'http';

const form = new FormData();
form.append('name', 'Test User');
form.append('email', 'test@example.com');
form.append('category', 'Bug');
form.append('priority', 'High');
form.append('description', 'Test Description');
form.append('screenshot', fs.createReadStream('package.json'));

const request = http.request({
  method: 'POST',
  host: 'localhost',
  port: 3001,
  path: '/api/report-issue',
  headers: form.getHeaders()
});

form.pipe(request);

request.on('response', function(res) {
  console.log('Status Code:', res.statusCode);
  res.on('data', chunk => {
    console.log('Response body: ' + chunk);
  });
});
request.on('error', function(err) {
  console.error(err);
});

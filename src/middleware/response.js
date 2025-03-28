const express = require('express');

const errorMessage = {
  401: 'Unauthorized',
  400: 'Bad Request',
  500: 'Internal Server Error',
};

express.response.error = function (code, error, request, message) {
  message = message || errorMessage[code];
  console.log(
    'Error:',
    error || message,
    'Request Body:',
    request.body,
    'Request Path:',
    request.path,
  );
  return this.status(code).json({ error: message });
};

express.response.respond = function (req, body) {
  console.log(
    req.path,
    'request:',
    JSON.stringify(req.body),
    'response:',
    JSON.stringify(body),
  );
  return this.json(body);
};

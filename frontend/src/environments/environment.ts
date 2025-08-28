const apiUrl =
  (typeof process !== 'undefined' && process.env['API_URL']) ||
  'http://localhost:3000/api';

export const environment = {
  production: false,
  apiUrl,
};

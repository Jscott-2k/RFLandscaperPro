const apiUrl =
  (typeof process !== 'undefined' && process.env['API_URL']) ||
  'http://backend:3000/api';

export const environment = {
  production: false,
  apiUrl,
};

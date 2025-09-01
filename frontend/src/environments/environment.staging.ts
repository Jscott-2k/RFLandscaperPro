const apiUrl =
  (typeof process !== 'undefined' && process.env['API_URL']) ||
  'https://staging.rflandscaperpro.com/api';

export const environment = {
  apiUrl,
  production: false,
};

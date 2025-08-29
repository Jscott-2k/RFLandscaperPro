const apiUrl =
  (typeof process !== 'undefined' && process.env['API_URL']) || 'https://rflandscaperpro.com/api';

export const environment = {
  production: true,
  apiUrl,
};

// Placeholder for extra APIs — settings page imports this
export const usersApi = {
  getAll: () => import('./api').then(m => m.api.get('/users')),
};

export default {
  routes: [
    {
      method: 'POST',
      path: '/students/:id/portal-access',
      handler: 'student.createPortalAccess',
      config: {
        auth: false,
        middlewares: ['api::student.auth-filter']
      },
    },
    {
      method: 'PUT',
      path: '/students/:id/portal-access-status',
      handler: 'student.updatePortalAccessStatus',
      config: {
        auth: false,
        middlewares: ['api::student.auth-filter']
      },
    },
    {
      method: 'GET',
      path: '/students/me',
      handler: 'api::student.student.me',
      config: {
        auth: { enabled: true },
      },
    },
  ],
};

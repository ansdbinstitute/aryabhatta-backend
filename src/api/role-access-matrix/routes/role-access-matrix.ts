export default {
  routes: [
    {
      method: 'GET',
      path: '/role-access-matrices',
      handler: 'api::role-access-matrix.role-access-matrix.find',
      config: {
        auth: { enabled: true },
      },
    },
    {
      method: 'GET',
      path: '/role-access-matrices/:role',
      handler: 'api::role-access-matrix.role-access-matrix.findOne',
      config: {
        auth: { enabled: true },
      },
    },
    {
      method: 'PUT',
      path: '/role-access-matrices/:role',
      handler: 'api::role-access-matrix.role-access-matrix.update',
      config: {
        auth: { enabled: true },
      },
    },
  ],
};

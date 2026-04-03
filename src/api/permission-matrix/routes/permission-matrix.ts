export default {
  routes: [
    {
      method: 'GET',
      path: '/permission-matrices/available',
      handler: 'api::permission-matrix.permission-matrix.getAvailableContentTypes',
      config: {
        auth: { enabled: true },
      },
    },
    {
      method: 'GET',
      path: '/permission-matrices/user/:id',
      handler: 'api::permission-matrix.permission-matrix.getUserPermissions',
      config: {
        auth: { enabled: true },
      },
    },
    {
      method: 'POST',
      path: '/permission-matrices/user/:id',
      handler: 'api::permission-matrix.permission-matrix.setUserPermissions',
      config: {
        auth: { enabled: true },
      },
    },
    {
      method: 'DELETE',
      path: '/permission-matrices/user/:id/:permissionId',
      handler: 'api::permission-matrix.permission-matrix.removeUserPermission',
      config: {
        auth: { enabled: true },
      },
    },
  ],
};

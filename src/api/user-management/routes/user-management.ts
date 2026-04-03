export default {
  routes: [
    {
      method: 'GET',
      path: '/user-management/users',
      handler: 'api::user-management.user-management.find',
      config: {
        auth: { enabled: true },
      },
    },
    {
      method: 'GET',
      path: '/user-management/users/:id',
      handler: 'api::user-management.user-management.findOne',
      config: {
        auth: { enabled: true },
      },
    },
    {
      method: 'POST',
      path: '/user-management/users',
      handler: 'api::user-management.user-management.create',
      config: {
        auth: { enabled: true },
      },
    },
    {
      method: 'PUT',
      path: '/user-management/users/:id',
      handler: 'api::user-management.user-management.update',
      config: {
        auth: { enabled: true },
      },
    },
    {
      method: 'DELETE',
      path: '/user-management/users/:id',
      handler: 'api::user-management.user-management.delete',
      config: {
        auth: { enabled: true },
      },
    },
    {
      method: 'PUT',
      path: '/user-management/users/:id/role',
      handler: 'api::user-management.user-management.changeRole',
      config: {
        auth: { enabled: true },
      },
    },
    {
      method: 'PUT',
      path: '/user-management/users/:id/password',
      handler: 'api::user-management.user-management.changePassword',
      config: {
        auth: { enabled: true },
      },
    },
    {
      method: 'PUT',
      path: '/user-management/profile',
      handler: 'api::user-management.user-management.updateMe',
      config: {
        auth: { enabled: true },
      },
    },
    {
      method: 'PUT',
      path: '/user-management/profile/password',
      handler: 'api::user-management.user-management.changeMyPassword',
      config: {
        auth: { enabled: true },
      },
    },
    {
      method: 'GET',
      path: '/user-management/branches',
      handler: 'api::user-management.user-management.getBranches',
      config: {
        auth: { enabled: true },
      },
    },
    {
      method: 'GET',
      path: '/user-management/role-types',
      handler: 'api::user-management.user-management.getRoleTypes',
      config: {
        auth: { enabled: true },
      },
    },
    {
      method: 'PUT',
      path: '/user-management/users/:id/branch-access',
      handler: 'api::user-management.user-management.updateBranchAccess',
      config: {
        auth: { enabled: true },
      },
    },
    {
      method: 'GET',
      path: '/user-management/branch-access',
      handler: 'api::user-management.user-management.getBranchAccess',
      config: {
        auth: { enabled: true },
      },
    },
  ],
};

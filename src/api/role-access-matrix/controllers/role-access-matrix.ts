export default {
  async find(ctx) {
    const { user } = ctx.state;
    
    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    const fullUser: any = await strapi.entityService.findOne('plugin::users-permissions.user', user.id);

    if (!fullUser?.roleType) {
      return ctx.forbidden('Access denied');
    }
    
    const uid = 'api::role-access-matrix.role-access-matrix' as any;
    let entries = await strapi.entityService.findMany(uid);
    
    if (!entries || (entries as any).id === undefined) {
      const defaultPermissions = getDefaultPermissions();
      const entry = await strapi.entityService.create(uid, {
        data: defaultPermissions
      });
      return entry;
    }
    return entries;
  },

  async findOne(ctx) {
    const { user } = ctx.state;
    
    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    const fullUser: any = await strapi.entityService.findOne('plugin::users-permissions.user', user.id);

    if (!fullUser?.roleType) {
      return ctx.forbidden('Access denied');
    }
    
    const uid = 'api::role-access-matrix.role-access-matrix' as any;
    const { role } = ctx.params;
    let entries = await strapi.entityService.findMany(uid);
    
    if (!entries || (entries as any).id === undefined) {
      const defaultPermissions = getDefaultPermissions();
      await strapi.entityService.create(uid, {
        data: defaultPermissions
      });
      return defaultPermissions[role] || {};
    }
    
    return (entries as any)[role] || {};
  },

  async update(ctx) {
    const { user } = ctx.state;
    
    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    const fullUser: any = await strapi.entityService.findOne('plugin::users-permissions.user', user.id);

    if (fullUser?.roleType !== 'institute_admin') {
      return ctx.forbidden('Only Institute Admin can update the access matrix');
    }
    
    const uid = 'api::role-access-matrix.role-access-matrix' as any;
    const { role } = ctx.params;
    const { data } = ctx.request.body;
    
    let entries = await strapi.entityService.findMany(uid);
    
    if (!entries || (entries as any).id === undefined) {
      const defaultPermissions = getDefaultPermissions();
      defaultPermissions[role] = data;
      const entry = await strapi.entityService.create(uid, {
        data: defaultPermissions
      });
      return entry;
    }
    
    const entry = entries as any;
    const existingRolePermissions = entry[role] || {};
    const mergedPermissions = { ...existingRolePermissions, ...data };
    
    const updated = await strapi.entityService.update(uid, entry.id, {
      data: {
        [role]: mergedPermissions
      }
    });
    
    return updated;
  }
};

function getDefaultPermissions() {
  return {
    institute_admin: {
      'institute-settings': ['create', 'read', 'update', 'delete'],
      branches: ['create', 'read', 'update', 'delete'],
      courses: ['create', 'read', 'update', 'delete'],
      batches: ['create', 'read', 'update', 'delete'],
      students: ['create', 'read', 'update', 'delete'],
      'id-cards': ['create', 'read', 'update', 'delete'],
      results: ['create', 'read', 'update', 'delete'],
      certificates: ['create', 'read', 'update', 'delete'],
      attendance: ['create', 'read', 'update', 'delete'],
      exams: ['create', 'read', 'update', 'delete'],
      'fee-structures': ['create', 'read', 'update', 'delete'],
      payments: ['create', 'read', 'update', 'delete'],
      notices: ['create', 'read', 'update', 'delete'],
      staff: ['create', 'read', 'update', 'delete'],
      users: ['create', 'read', 'update', 'delete'],
      'access-matrix': ['create', 'read', 'update', 'delete'],
      'campus-network': ['create', 'read', 'update', 'delete'],
      settings: ['create', 'read', 'update', 'delete'],
      dashboard: ['read'],
    },
    branch_admin: {
      branches: ['read'],
      courses: ['read'],
      batches: ['create', 'read', 'update', 'delete'],
      students: ['create', 'read', 'update'],
      'id-cards': ['read'],
      results: ['create', 'read', 'update'],
      certificates: ['read'],
      attendance: ['create', 'read', 'update'],
      exams: ['create', 'read', 'update'],
      'fee-structures': ['read'],
      payments: ['read'],
      notices: ['read'],
      staff: ['read'],
      users: ['read'],
      'campus-network': ['read'],
      settings: ['read'],
      dashboard: ['read'],
    },
    teacher: {
      courses: ['read'],
      batches: ['read'],
      students: ['read'],
      attendance: ['create', 'read'],
      exams: ['read'],
      results: ['create', 'read'],
      notices: ['read'],
      dashboard: ['read'],
    },
    accountant: {
      'fee-structures': ['create', 'read', 'update'],
      payments: ['create', 'read', 'update'],
      students: ['read'],
      notices: ['read'],
      dashboard: ['read'],
    },
    student: {
      courses: ['read'],
      batches: ['read'],
      students: ['read'],
      attendance: ['read'],
      'fee-structures': ['read'],
      payments: ['read'],
      exams: ['read'],
      results: ['read'],
      notices: ['read'],
      dashboard: ['read'],
    },
  };
}

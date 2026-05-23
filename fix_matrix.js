const strapi = require('@strapi/strapi');

(async () => {
  const app = await strapi().load();
  const matrices = await app.entityService.findMany('api::role-access-matrix.role-access-matrix');
  
  const fullPermissions = {
    students: ['create', 'read', 'update', 'delete'],
    'id-cards': ['create', 'read', 'update', 'delete'],
    results: ['create', 'read', 'update', 'delete'],
    certificates: ['create', 'read', 'update', 'delete'],
    courses: ['create', 'read', 'update', 'delete'],
    batches: ['create', 'read', 'update', 'delete'],
    attendance: ['create', 'read', 'update', 'delete'],
    exams: ['create', 'read', 'update', 'delete'],
    materials: ['create', 'read', 'update', 'delete'],
    'fee-structures': ['create', 'read', 'update', 'delete'],
    payments: ['create', 'read', 'update', 'delete'],
    staff: ['create', 'read', 'update', 'delete'],
    users: ['create', 'read', 'update', 'delete'],
    branches: ['create', 'read', 'update', 'delete'],
    notices: ['create', 'read', 'update', 'delete'],
    settings: ['create', 'read', 'update', 'delete'],
    dashboard: ['read'],
    placements: ['create', 'read', 'update', 'delete'],
    'campus-network': ['create', 'read', 'update', 'delete'],
    'access-matrix': ['create', 'read', 'update', 'delete']
  };

  if (matrices) {
    const id = Array.isArray(matrices) ? matrices[0]?.id : matrices.id;
    if (id) {
      await app.entityService.update('api::role-access-matrix.role-access-matrix', id, {
        data: { institute_admin: fullPermissions }
      });
      console.log("Updated existing matrix in DB!");
    } else {
      await app.entityService.create('api::role-access-matrix.role-access-matrix', {
        data: { institute_admin: fullPermissions }
      });
      console.log("Created new matrix in DB!");
    }
  }
  process.exit(0);
})();

const { createStrapi } = require('@strapi/strapi');

(async () => {
  const app = await createStrapi().load();
  
  try {
    const roles = await app.entityService.findMany('plugin::users-permissions.role', {
      filters: { type: 'authenticated' }
    });

    if (!roles || roles.length === 0) {
      console.error('Authenticated role not found');
      process.exit(1);
    }
    const authRole = roles[0];

    const actionsToGrant = [
      'api::student.student.createPortalAccess',
      'api::student.student.updatePortalAccessStatus'
    ];

    for (const action of actionsToGrant) {
      const existing = await app.db.query('plugin::users-permissions.permission').findOne({
        where: { action, role: authRole.id }
      });

      if (!existing) {
        await app.db.query('plugin::users-permissions.permission').create({
          data: { action, role: authRole.id }
        });
        console.log(`Granted ${action} to Authenticated role.`);
      } else {
        console.log(`${action} already granted.`);
      }
    }
    console.log('Permission check complete.');
  } catch (err) {
    console.error('Error granting permission:', err);
  } finally {
    process.exit(0);
  }
})();

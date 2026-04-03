export default {
  register(/*{ strapi }*/) {},

  async bootstrap({ strapi }) {
    // 0. Disable Sharp cache for Windows file permission fixes
    try {
      const sharp = require('sharp');
      sharp.cache(false);
      strapi.log.info('Sharp image cache disabled (Windows EPERM fix).');
    } catch (e) {
      // ignore if sharp not installed
    }
    
    // 1. Seed Institute Settings if empty
    const settings = await strapi.entityService.findMany('api::institute-setting.institute-setting');
    if (!settings || (Array.isArray(settings) && settings.length === 0)) {
      await strapi.entityService.create('api::institute-setting.institute-setting', {
        data: {
          instituteName: 'Aryabhatta National Skill Development Board',
          instituteCode: 'ANSDB',
          contactEmail: 'info@ansdb.org',
          contactPhone: '1800-123-4567',
          address: 'Bolpur, Birbhum, West Bengal',
          currentAcademicYear: '2026-27',
          receiptPrefix: 'REC-',
          studentUidFormat: '{INST}-{YEAR}-{COURSE}-{SEQ}'
        }
      });
      strapi.log.info('Seeded default Institute Settings.');
    }

    // 2. Seed Default Main Branch if empty
    const branches = await strapi.entityService.findMany('api::branch.branch');
    if (!branches || (Array.isArray(branches) && branches.length === 0)) {
      await strapi.entityService.create('api::branch.branch', {
        data: {
          name: 'Main Campus',
          address: 'Aryabhatta National Skill Development Board, Bolpur, Birbhum, West Bengal'
        }
      });
      strapi.log.info('Seeded default Main Campus branch.');
    }

    // 3. Create Institute Admin if not exists
    const userService = strapi.plugins['users-permissions'].services.user;
    const existingInstituteAdmin = await userService.fetchAll({ query: { email: 'institute@ansdb.org' } });

    if (!existingInstituteAdmin || existingInstituteAdmin.length === 0) {
      const roles = await strapi.entityService.findMany('plugin::users-permissions.role');
      const authenticatedRole = roles.find((r: any) => r.type === 'authenticated');

      if (authenticatedRole) {
        await userService.add({
          username: 'institute_admin',
          email: 'institute@ansdb.org',
          password: 'InstituteAdmin123!',
          confirmed: true,
          provider: 'local',
          role: authenticatedRole.id,
          roleType: 'institute_admin'
        });
        strapi.log.info('Created Institute Admin: institute@ansdb.org / InstituteAdmin123!');
      }
    }

    // 4. Seed Permissions for Authenticated Role
    await grantPermissions(strapi);

    // 5. Seed Role Access Matrix
    await seedRoleAccessMatrix(strapi);

    // 6. Seed Courses if empty
    await seedCourses(strapi);

    strapi.log.info('Bootstrap completed successfully.');
  },
};

async function seedRoleAccessMatrix(strapi: any) {
  const ROLES = ['institute_admin', 'branch_admin', 'teacher', 'accountant', 'student'];
  const MATERIAL_PERMS = ['create', 'read', 'update', 'delete'];
  const STUDENT_MATERIAL_PERMS = ['read'];
  
  try {
    // Strapi 5 uses FindMany with limit 1 for Single Types or a specific service method
    const matrix = await strapi.entityService.findMany('api::role-access-matrix.role-access-matrix');
    
    if (!matrix) {
      const defaultData = {};
      ROLES.forEach(role => {
        defaultData[role] = { 
          materials: role === 'student' ? STUDENT_MATERIAL_PERMS : MATERIAL_PERMS 
        };
      });
      
      await strapi.entityService.create('api::role-access-matrix.role-access-matrix', {
        data: defaultData
      });
      strapi.log.info('[RoleAccessMatrix] Created default matrix with Materials enabled.');
    } else {
      // Update existing matrix
      const updateData = {};
      let hasChanges = false;

      ROLES.forEach(role => {
        const currentPerms = matrix[role] || {};
        const materials = currentPerms.materials || [];
        const targetPerms = role === 'student' ? STUDENT_MATERIAL_PERMS : MATERIAL_PERMS;
        
        const missingPerms = targetPerms.filter(p => !materials.includes(p));
        
        if (missingPerms.length > 0) {
          updateData[role] = {
            ...currentPerms,
            materials: [...new Set([...materials, ...targetPerms])]
          };
          hasChanges = true;
        }
      });

      if (hasChanges) {
        // Single Type update in Strapi 5
        await strapi.entityService.createOrUpdate('api::role-access-matrix.role-access-matrix', {
          data: updateData
        });
        strapi.log.info('[RoleAccessMatrix] Synchronized Materials permissions.');
      }
    }
  } catch (error) {
    strapi.log.error(`[RoleAccessMatrix] Seeding failed: ${error.message}`);
  }
}

async function seedCourses(strapi: any) {
  const coursesToSeed = [
    { title: 'Mobile Repairing', code: 'MR', durationValue: 6, durationUnit: 'months', description: 'Comprehensive mobile hardware and software repair course.' },
    { title: 'Web Development', code: 'WD', durationValue: 12, durationUnit: 'months', description: 'Full stack web development including React and Node.js.' },
    { title: 'R. A. C. W. Repairing', code: 'RACW', durationValue: 4, durationUnit: 'months', description: 'Refrigeration and Air Conditioning technical training.' },
    { title: 'Basic Computer', code: 'BC', durationValue: 3, durationUnit: 'months', description: 'Essential computer literacy and MS Office skills.' },
    { title: 'Python Programming', code: 'PY', durationValue: 6, durationUnit: 'months', description: 'Core Python and Data Science fundamentals.' },
    { title: 'AI & Machine Learning', code: 'AIML', durationValue: 12, durationUnit: 'months', description: 'Artificial Intelligence and Deep Learning algorithms.' },
    { title: 'Internet of Things (IoT)', code: 'IOT', durationValue: 6, durationUnit: 'months', description: 'Smart device integration and sensor connectivity.' }
  ];

  try {
    for (const course of coursesToSeed) {
      const existing = await strapi.entityService.findMany('api::course.course', {
        filters: { code: course.code }
      });

      if (!existing || existing.length === 0) {
        await strapi.entityService.create('api::course.course', {
          data: {
            ...course,
            isActive: true,
            sortOrder: coursesToSeed.indexOf(course)
          }
        });
        strapi.log.info(`Seeded Course: ${course.title} (${course.code})`);
      }
    }
  } catch (error) {
    strapi.log.error(`Course seeding failed: ${error.message}`);
  }
}

async function grantPermissions(strapi: any) {
  try {
    const roles = await strapi.entityService.findMany('plugin::users-permissions.role');

    if (!roles || roles.length === 0) {
      strapi.log.warn('No roles found for permission seeding.');
      return;
    }

    const publicPermissions = [
      'api::notice.notice.find',
      'api::notice.notice.findOne',
      'api::course.course.find',
      'api::course.course.findOne',
    ];

    const permissionsToGrant = [
      // Students
      'api::student.student.find',
      'api::student.student.findOne',
      'api::student.student.me',
      'api::student.student.create',
      'api::student.student.update',
      'api::student.student.delete',
      'api::student.student.createPortalAccess',
      'api::student.student.updatePortalAccessStatus',
      
      // Academic
      'api::course.course.find',
      'api::course.course.findOne',
      'api::course.course.create',
      'api::course.course.update',
      'api::course.course.delete',
      'api::batch.batch.find',
      'api::batch.batch.findOne',
      'api::batch.batch.create',
      'api::batch.batch.update',
      'api::batch.batch.delete',
      'api::attendance.attendance.find',
      'api::attendance.attendance.findOne',
      'api::attendance.attendance.create',
      'api::attendance.attendance.update',
      'api::attendance.attendance.delete',
      'api::exam.exam.find',
      'api::exam.exam.findOne',
      'api::exam.exam.create',
      'api::exam.exam.update',
      'api::exam.exam.delete',
      'api::exam-approval.exam-approval.find',
      'api::exam-approval.exam-approval.findOne',
      'api::exam-approval.exam-approval.create',
      'api::exam-approval.exam-approval.update',
      'api::exam-approval.exam-approval.delete',
      'api::result.result.find',
      'api::result.result.findOne',
      'api::result.result.create',
      'api::result.result.update',
      'api::result.result.delete',
      
      // Management
      'api::branch.branch.find',
      'api::branch.branch.findOne',
      'api::branch.branch.create',
      'api::branch.branch.update',
      'api::branch.branch.delete',
      'api::staff.staff.find',
      'api::staff.staff.findOne',
      'api::staff.staff.create',
      'api::staff.staff.update',
      'api::staff.staff.delete',
      
      // Financials
      'api::fee-structure.fee-structure.find',
      'api::fee-structure.fee-structure.findOne',
      'api::fee-structure.fee-structure.create',
      'api::fee-structure.fee-structure.update',
      'api::fee-structure.fee-structure.delete',
      'api::payment.payment.find',
      'api::payment.payment.findOne',
      'api::payment.payment.create',
      'api::payment.payment.update',
      'api::payment.payment.delete',
      
      // Matrix & Settings
      'api::role-access-matrix.role-access-matrix.find',
      'api::role-access-matrix.role-access-matrix.findOne',
      'api::role-access-matrix.role-access-matrix.create',
      'api::role-access-matrix.role-access-matrix.update',
      'api::role-access-matrix.role-access-matrix.delete',
      'api::permission-matrix.permission-matrix.getAvailableContentTypes',
      'api::permission-matrix.permission-matrix.getAvailableActions',
      'api::permission-matrix.permission-matrix.getUserPermissions',
      'api::permission-matrix.permission-matrix.setUserPermissions',
      'api::permission-matrix.permission-matrix.removeUserPermission',
      'api::institute-setting.institute-setting.find',
      'api::institute-setting.institute-setting.findOne',
      'api::institute-setting.institute-setting.update',
      
      // User Management
      'api::user-management.user-management.find',
      'api::user-management.user-management.findOne',
      'api::user-management.user-management.create',
      'api::user-management.user-management.update',
      'api::user-management.user-management.delete',
      'api::user-management.user-management.changeRole',
      'api::user-management.user-management.changePassword',
      'api::user-management.user-management.updateMe',
      'api::user-management.user-management.changeMyPassword',
      'api::user-management.user-management.getBranches',
      'api::user-management.user-management.getRoleTypes',
      
      // System
      'api::notice.notice.find',
      'api::notice.notice.findOne',
      'api::notice.notice.create',
      'api::notice.notice.update',
      'api::notice.notice.delete',
      'api::material.material.find',
      'api::material.material.findOne',
      'api::material.material.create',
      'api::material.material.update',
      'api::material.material.delete'
    ];

    for (const role of roles) {
      const isPublic = role.type === 'public';
      const targetPermissions = isPublic ? publicPermissions : permissionsToGrant;

      const existingPermissions = await strapi.db.query('plugin::users-permissions.permission').findMany({
        where: { role: role.id }
      });

      const existingActions = existingPermissions.map((p: any) => p.action);
      const newPermissions = targetPermissions.filter(action => !existingActions.includes(action));

      if (newPermissions.length > 0) {
        await Promise.all(
          newPermissions.map(action => 
            strapi.db.query('plugin::users-permissions.permission').create({
              data: { action, role: role.id }
            })
          )
        );
        strapi.log.info(`Granted ${newPermissions.length} new permissions to ${role.name} (${role.type}) role.`);
      }
    }
  } catch (error) {
    strapi.log.error(`Permission seeding failed: ${error.message}`);
  }
}

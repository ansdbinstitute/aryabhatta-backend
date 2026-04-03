
/**
 * Unified Permission Utility for ANSDB ERP
 * Checks both RoleAccessMatrix (Role-based) and PermissionMatrix (User-based overrides)
 */

const CONTENT_TYPE_MAP: Record<string, string> = {
  'api::payment.payment': 'payments',
  'api::student.student': 'students',
  'api::staff.staff': 'staff',
  'api::branch.branch': 'branches',
  'api::course.course': 'courses',
  'api::batch.batch': 'batches',
  'api::result.result': 'results',
  'api::attendance.attendance': 'attendance',
  'api::exam.exam': 'exams',
  'api::fee-structure.fee-structure': 'fee-structures',
  'api::notice.notice': 'notices',
  'api::material.material': 'materials',
  'api::institute-setting.institute-setting': 'institute-settings',
};

const ACTION_MAP: Record<string, string> = {
    'find': 'read',
    'findOne': 'read',
    'create': 'create',
    'update': 'update',
    'delete': 'delete',
};

export async function checkUserPermission(strapi: any, userId: number, contentType: string, action: string): Promise<boolean> {
  try {
    const user: any = await strapi.entityService.findOne('plugin::users-permissions.user', userId, {
      populate: ['role']
    });

    if (!user) return false;

    // 1. Check for Institute Admin (Always allowed)
    if (user.roleType === 'institute_admin') return true;

    // 2. Check RoleAccessMatrix (Global Role Permissions)
    const roleKey = user.roleType; // e.g., 'accountant', 'teacher'
    if (roleKey) {
      const matrixUID = 'api::role-access-matrix.role-access-matrix';
      const matrix = await strapi.entityService.findMany(matrixUID);
      
      if (matrix) {
        const rolePermissions = (matrix as any)[roleKey] || {};
        const matrixKey = CONTENT_TYPE_MAP[contentType];
        const mappedAction = ACTION_MAP[action] || action;

        if (matrixKey && rolePermissions[matrixKey]?.includes(mappedAction)) {
          return true;
        }
      }
    }

    // 3. Check PermissionMatrix (User-specific Overrides)
    const userMatrix = await strapi.entityService.findMany('api::permission-matrix.permission-matrix', {
      filters: { user: userId }
    });

    if (userMatrix && userMatrix.length > 0) {
      const hasOverride = userMatrix.some((pm: any) =>
        pm.allowedContentTypes?.includes(contentType) &&
        pm.allowedActions?.includes(action)
      );
      if (hasOverride) return true;
    }

    return false;
  } catch (error) {
    strapi.log.error(`Permission check failed for User ${userId}: ${error.message}`);
    return false;
  }
}

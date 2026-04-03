import { errors } from '@strapi/utils';

const { ForbiddenError } = errors;

/**
 * Universal RBAC Middleware
 * Enforces the "Access Matrix" settings defined by the Institute Admin.
 * This is applied globally to ensure permissions take effect immediately.
 */
export default (config, { strapi }) => {
  return async (ctx, next) => {
    const user = ctx.state.user;

    // 1. Skip if no user or if the request is not directed to a content-type (e.g. auth, upload, etc.)
    if (!user || !ctx.state.route || !ctx.state.route.info) {
      return await next();
    }

    // 2. Load User Details & Role Type
    const fullUser: any = await strapi.entityService.findOne('plugin::users-permissions.user', user.id);
    const roleType = fullUser?.roleType;
    const url = ctx.url || '';

    // Skip for students entirely - they use ownership filtering in their custom controllers
    if (roleType === 'student') {
      return await next();
    }

    const { apiName, action } = ctx.state.route.info;

    // Skip if it's not an API request
    if (!apiName) {
      return await next();
    }

    strapi.log.debug(`[RBAC] User: ${user.id}, Role: ${roleType}, API: ${apiName}, Action: ${action}`);

    // Institute Admins have total power - skip checks
    if (roleType === 'institute_admin') {
      return await next();
    }

    // Load the Role Access Matrix (Single Type)
    const matrixResult = await strapi.entityService.findMany('api::role-access-matrix.role-access-matrix');
    const matrix = Array.isArray(matrixResult) ? matrixResult[0] : matrixResult;

    if (!matrix) {
      strapi.log.warn('[RBAC] No Role Access Matrix found in database.');
      return await next();
    }

    // Determine the Resource Name
    const resourceMap: Record<string, string> = {
      'exam': 'exams',
      'exam-approval': 'exam-approvals',
      'student': 'students',
      'course': 'courses',
      'batch': 'batches',
      'payment': 'payments',
      'result': 'results',
      'attendance': 'attendance',
      'branch': 'branches',
      'staff': 'staff',
      'notice': 'notices',
      'material': 'materials',
      'fee-structure': 'fee-structures',
      'institute-setting': 'settings'
    };

    const resourceName = resourceMap[apiName] || apiName;
    
    // Standardize Strapi actions to Matrix actions
    const actionMap: Record<string, string> = {
      'find': 'read',
      'findOne': 'read',
      'create': 'create',
      'update': 'update',
      'delete': 'delete'
    };

    const matrixAction = actionMap[action] || (action.startsWith('get') || action.startsWith('find') ? 'read' : action);

    // Check Permission in Matrix
    const rolePermissions = matrix[roleType] || {};
    const allowedActions = rolePermissions[resourceName] || [];

    strapi.log.debug(`[RBAC] Checking matrix for ${roleType} -> ${resourceName} -> ${matrixAction}. Allowed: ${JSON.stringify(allowedActions)}`);

    if (allowedActions.includes(matrixAction)) {
      return await next();
    }

    strapi.log.info(`[RBAC] BLOCKING: User ${user.id} (${roleType}) attempted ${matrixAction} on ${resourceName}`);

    // If it's not allowed, block immediately
    throw new ForbiddenError(`You do not have permission to ${matrixAction} ${resourceName}`);
  };
};

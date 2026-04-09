import { factories } from '@strapi/strapi';

const checkUserPermission = async (strapi: any, userId: number, contentType: string, action: string): Promise<boolean> => {
  const user: any = await strapi.entityService.findOne('plugin::users-permissions.user', userId, {
    populate: ['branch']
  });

  if (!user) return false;

  const roleType = user.roleType;

  if (roleType === 'institute_admin') {
    return true;
  }

  const permissionMatrix = await strapi.entityService.findMany('api::permission-matrix.permission-matrix', {
    filters: { user: userId }
  });

  return permissionMatrix.some((pm: any) =>
    pm.allowedContentTypes?.includes(contentType) &&
    pm.allowedActions?.includes(action)
  );
};

const getUserBranchId = async (strapi: any, userId: number): Promise<number | null> => {
  const user: any = await strapi.entityService.findOne('plugin::users-permissions.user', userId, {
    populate: ['branch']
  });

  return user?.branch?.id || null;
};

const canManageBranch = async (strapi: any, userId: number, branchId: number): Promise<boolean> => {
  const user: any = await strapi.entityService.findOne('plugin::users-permissions.user', userId, {
    populate: ['branch']
  });

  if (!user) return false;

  const roleType = user.roleType;

  if (roleType === 'institute_admin') {
    return true;
  }

  return false;
};

const getUserRoleType = async (strapi: any, userId: number): Promise<string | null> => {
  const user: any = await strapi.entityService.findOne('plugin::users-permissions.user', userId);
  return user?.roleType || null;
};

export default factories.createCoreService('api::permission-matrix.permission-matrix', ({ strapi }) => ({
  checkUserPermission,
  getUserBranchId,
  canManageBranch,
  getUserRoleType,
}));

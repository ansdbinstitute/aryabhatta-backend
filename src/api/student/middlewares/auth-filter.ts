import { checkUserPermission } from '../../../utils/permission-checker';
import { canViewAllBranchData } from '../../../utils/branch-access';

export default (config, { strapi }) => {
  return async (ctx, next) => {
    let user = ctx.state.user;

    // If Strapi's users-permissions bypassed auth, manually verify token here to prevent 403 routing issues
    if (!user && ctx.request.header.authorization) {
      try {
        const token = ctx.request.header.authorization.replace('Bearer ', '');
        const decoded = await strapi.plugins['users-permissions'].services.jwt.verify(token);
        if (decoded && decoded.id) {
          user = { id: decoded.id };
          ctx.state.user = user;
        }
      } catch (err) {
        // Ignore, if user remains undefined, handle below
      }
    }

    if (!user) {
      return await next();
    }

    const fullUser: any = await strapi.entityService.findOne('plugin::users-permissions.user', user.id, {
      populate: ['branch']
    });

    const roleType = fullUser.roleType;

    const hasAccessToAll = await canViewAllBranchData(user.id);
    if (hasAccessToAll) {
      return await next();
    }

    if (roleType === 'branch_admin') {
      const branchId = fullUser.branch?.id;
      if (!branchId) {
        ctx.query.filters = { ...ctx.query.filters, id: { $in: [] } };
        return await next();
      }

      ctx.query.filters = {
        ...ctx.query.filters,
        branch: branchId
      };

      return await next();
    }

    if (roleType === 'teacher') {
      // canAccessAllBranches already checked above
      // If teacher doesn't have cross-branch access, see all students in their branch
      const branchId = fullUser.branch?.id;
      if (branchId) {
        ctx.query.filters = {
          ...ctx.query.filters,
          branch: branchId
        };
      }
      return await next();
    }

    if (roleType === 'accountant') {
      const branchId = fullUser.branch?.id;
      if (branchId) {
        ctx.query.filters = {
          ...ctx.query.filters,
          branch: branchId
        };
      }
      return await next();
    }

    if (roleType === 'student') {
      ctx.query.filters = {
        ...ctx.query.filters,
        user: user.id
      };
      return await next();
    }

    const hasPermission = await checkUserPermission(strapi, user.id, 'api::student.student', 'find');

    if (hasPermission) {
      return await next();
    }

    ctx.query.filters = { ...ctx.query.filters, id: { $in: [] } };
    return await next();
  };
};

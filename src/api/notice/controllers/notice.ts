import { factories } from '@strapi/strapi';
import { canAccessAllBranches, getUserWithBranch } from '../../../utils/branch-access';
import { checkUserPermission } from '../../../utils/permission-checker';

export default factories.createCoreController('api::notice.notice', ({ strapi }) => ({
  async find(ctx) {
    const user = ctx.state.user;

    if (!user) {
      const existingFilters = (ctx.query.filters && typeof ctx.query.filters === 'object')
        ? (ctx.query.filters as Record<string, unknown>)
        : {};
      const existingPopulate = (ctx.query.populate && typeof ctx.query.populate === 'object')
        ? (ctx.query.populate as Record<string, unknown>)
        : {};

      ctx.query = {
        ...ctx.query,
        filters: {
          ...existingFilters,
          isPublic: true,
        },
        populate: {
          ...existingPopulate,
          attachments: true,
          targetBatches: true,
        },
      };

      return await super.find(ctx);
    }

    return await super.find(ctx);
  },

  async findOne(ctx) {
    const user = ctx.state.user;

    if (!user) {
      const notice = await strapi.entityService.findOne('api::notice.notice', ctx.params.id, {
        populate: ['attachments', 'targetBatches'],
      });

      if (!notice || !notice.isPublic) {
        return ctx.notFound('Notice not found');
      }

      return this.transformResponse(notice);
    }

    return await super.findOne(ctx);
  },

  async create(ctx) {
    const user = ctx.state.user;

    if (!user) return await super.create(ctx);

    const hasAccessToAll = await canAccessAllBranches(user.id);
    if (hasAccessToAll) {
      return await super.create(ctx);
    }

    const fullUser = await getUserWithBranch(user.id);
    if (!fullUser) return await super.create(ctx);

    const roleType = fullUser.roleType;

    if (roleType === 'branch_admin' || roleType === 'teacher' || roleType === 'accountant') {
      const hasPermission = await checkUserPermission(strapi, user.id, 'api::notice.notice', 'create');
      if (!hasPermission) return ctx.forbidden('You do not have permission to create notices.');
      return await super.create(ctx);
    }

    return ctx.forbidden('You do not have permission to create notices.');
  },

  async update(ctx) {
    const user = ctx.state.user;

    if (!user) return await super.update(ctx);

    const hasAccessToAll = await canAccessAllBranches(user.id);
    if (hasAccessToAll) {
      return await super.update(ctx);
    }

    const fullUser = await getUserWithBranch(user.id);
    if (!fullUser) return await super.update(ctx);

    const roleType = fullUser.roleType;

    if (roleType === 'branch_admin' || roleType === 'teacher' || roleType === 'accountant') {
      const hasPermission = await checkUserPermission(strapi, user.id, 'api::notice.notice', 'update');
      if (!hasPermission) return ctx.forbidden('You do not have permission to update notices.');
      return await super.update(ctx);
    }

    return ctx.forbidden('You do not have permission to update notices.');
  },

  async delete(ctx) {
    const user = ctx.state.user;

    if (!user) return await super.delete(ctx);

    const hasAccessToAll = await canAccessAllBranches(user.id);
    if (hasAccessToAll) {
      return await super.delete(ctx);
    }

    const fullUser = await getUserWithBranch(user.id);
    if (!fullUser) return await super.delete(ctx);

    const roleType = fullUser.roleType;

    if (roleType === 'branch_admin' || roleType === 'teacher' || roleType === 'accountant') {
      const hasPermission = await checkUserPermission(strapi, user.id, 'api::notice.notice', 'delete');
      if (!hasPermission) return ctx.forbidden('You do not have permission to delete notices.');
      return await super.delete(ctx);
    }

    return ctx.forbidden('You do not have permission to delete notices.');
  },
}));

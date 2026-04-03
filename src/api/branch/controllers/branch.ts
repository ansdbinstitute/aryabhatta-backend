import { factories } from '@strapi/strapi';
import { checkUserPermission } from '../../../utils/permission-checker';

export default factories.createCoreController('api::branch.branch', ({ strapi }) => ({
  async find(ctx) {
    const user = ctx.state.user;

    if (!user) return await super.find(ctx);

    const fullUser: any = await strapi.entityService.findOne('plugin::users-permissions.user', user.id, {
      populate: ['branch']
    });

    const roleType = fullUser.roleType;

    if (roleType === 'institute_admin') {
      return await super.find(ctx);
    }

    if (roleType === 'branch_admin') {
      const branchId = fullUser.branch?.id;
      if (!branchId) {
        return ctx.send({ data: [], meta: { pagination: { total: 0 } } });
      }

      ctx.query.filters = {
        id: branchId
      };

      return await super.find(ctx);
    }

    const hasPermission = await checkUserPermission(strapi, user.id, 'api::branch.branch', 'find');

    if (hasPermission) {
      return await super.find(ctx);
    }

    return ctx.forbidden('You do not have permission to view branches.');
  },

  async findOne(ctx) {
    const user = ctx.state.user;
    const { id } = ctx.params;

    if (!user) return await super.findOne(ctx);

    const fullUser: any = await strapi.entityService.findOne('plugin::users-permissions.user', user.id, {
      populate: ['branch']
    });

    const roleType = fullUser.roleType;

    if (roleType === 'institute_admin') {
      return await super.findOne(ctx);
    }

    if (roleType === 'branch_admin') {
      const branchId = fullUser.branch?.id;
      if (parseInt(id) !== branchId) {
        return ctx.forbidden('You can only view your own branch.');
      }
      return await super.findOne(ctx);
    }

    const hasPermission = await checkUserPermission(strapi, user.id, 'api::branch.branch', 'findOne');

    if (hasPermission) {
      return await super.findOne(ctx);
    }

    return ctx.forbidden('You do not have permission to view this branch.');
  },

  async create(ctx) {
    const user = ctx.state.user;

    if (!user) return await super.create(ctx);

    const fullUser: any = await strapi.entityService.findOne('plugin::users-permissions.user', user.id);

    const roleType = fullUser.roleType;

    if (roleType === 'institute_admin') {
      return await super.create(ctx);
    }

    return ctx.forbidden('Only Institute Admin can create branches.');
  },

  async update(ctx) {
    const user = ctx.state.user;
    const { id } = ctx.params;

    if (!user) return await super.update(ctx);

    const fullUser: any = await strapi.entityService.findOne('plugin::users-permissions.user', user.id, {
      populate: ['branch']
    });

    const roleType = fullUser.roleType;

    if (roleType === 'institute_admin') {
      return await super.update(ctx);
    }

    if (roleType === 'branch_admin') {
      const branchId = fullUser.branch?.id;
      if (parseInt(id) !== branchId) {
        return ctx.forbidden('You can only update your own branch.');
      }
      return await super.update(ctx);
    }

    return ctx.forbidden('Only Institute Admin can update branches.');
  },

  async delete(ctx) {
    const user = ctx.state.user;

    if (!user) return await super.delete(ctx);

    const fullUser: any = await strapi.entityService.findOne('plugin::users-permissions.user', user.id);

    const roleType = fullUser.roleType;

    if (roleType === 'institute_admin') {
      return await super.delete(ctx);
    }

    return ctx.forbidden('Only Institute Admin can delete branches.');
  },
}));

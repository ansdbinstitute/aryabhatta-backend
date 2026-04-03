import { factories } from '@strapi/strapi';
import { checkUserPermission } from '../../../utils/permission-checker';
import { canAccessAllBranches, getUserWithBranch } from '../../../utils/branch-access';

export default factories.createCoreController('api::staff.staff', ({ strapi }) => ({
  async find(ctx) {
    const user = ctx.state.user;

    if (!user) return await super.find(ctx);

    const hasAccessToAll = await canAccessAllBranches(user.id);
    if (hasAccessToAll) {
      return await super.find(ctx);
    }

    const fullUser = await getUserWithBranch(user.id);
    if (!fullUser) return await super.find(ctx);

    const roleType = fullUser.roleType;

    if (roleType === 'branch_admin') {
      const branchId = fullUser.branch?.id;
      if (!branchId) {
        return ctx.send({ data: [], meta: { pagination: { total: 0 } } });
      }

      ctx.query.filters = {
        ...(ctx.query.filters as any),
        workLocation: branchId
      };

      return await super.find(ctx);
    }

    const hasPermission = await checkUserPermission(strapi, user.id, 'api::staff.staff', 'find');

    if (hasPermission) {
      const branchId = fullUser.branch?.id;
      if (branchId) {
        ctx.query.filters = {
          ...(ctx.query.filters as any),
          workLocation: branchId
        };
      }
      return await super.find(ctx);
    }

    return ctx.forbidden('You do not have permission to view staff.');
  },

  async findOne(ctx) {
    const { id } = ctx.params;
    const user = ctx.state.user;

    if (!user) return await super.findOne(ctx);

    const hasAccessToAll = await canAccessAllBranches(user.id);
    if (hasAccessToAll) {
      return await super.findOne(ctx);
    }

    const fullUser = await getUserWithBranch(user.id);
    if (!fullUser) return await super.findOne(ctx);

    const roleType = fullUser.roleType;

    if (roleType === 'branch_admin') {
      const branchId = fullUser.branch?.id;
      const staff: any = await strapi.entityService.findOne('api::staff.staff', id, {
        populate: ['workLocation']
      });

      if (!staff) return ctx.notFound();

      if (staff.workLocation?.id !== branchId) {
        return ctx.forbidden('Staff member belongs to a different branch.');
      }

      return await super.findOne(ctx);
    }

    const hasPermission = await checkUserPermission(strapi, user.id, 'api::staff.staff', 'findOne');

    if (hasPermission) {
      return await super.findOne(ctx);
    }

    return ctx.forbidden('You do not have permission to view this staff member.');
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

    if (roleType === 'branch_admin') {
      const branchId = fullUser.branch?.id;
      if (branchId) {
        ctx.request.body.data.workLocation = branchId;
      }
      return await super.create(ctx);
    }

    const hasPermission = await checkUserPermission(strapi, user.id, 'api::staff.staff', 'create');

    if (hasPermission) {
      return await super.create(ctx);
    }

    return ctx.forbidden('You do not have permission to create staff.');
  },

  async update(ctx) {
    const user = ctx.state.user;
    const { id } = ctx.params;

    if (!user) return await super.update(ctx);

    const hasAccessToAll = await canAccessAllBranches(user.id);
    if (hasAccessToAll) {
      return await super.update(ctx);
    }

    const fullUser = await getUserWithBranch(user.id);
    if (!fullUser) return await super.update(ctx);

    const roleType = fullUser.roleType;

    if (roleType === 'branch_admin') {
      const branchId = fullUser.branch?.id;
      const staff: any = await strapi.entityService.findOne('api::staff.staff', id, {
        populate: ['workLocation']
      });

      if (!staff) return ctx.notFound();

      if (staff.workLocation?.id !== branchId) {
        return ctx.forbidden('You can only update staff in your own branch.');
      }

      return await super.update(ctx);
    }

    const hasPermission = await checkUserPermission(strapi, user.id, 'api::staff.staff', 'update');

    if (hasPermission) {
      return await super.update(ctx);
    }

    return ctx.forbidden('You do not have permission to update staff.');
  },

  async delete(ctx) {
    const user = ctx.state.user;
    const { id } = ctx.params;

    if (!user) return await super.delete(ctx);

    const hasAccessToAll = await canAccessAllBranches(user.id);
    if (hasAccessToAll) {
      return await super.delete(ctx);
    }

    const fullUser = await getUserWithBranch(user.id);
    if (!fullUser) return await super.delete(ctx);

    const roleType = fullUser.roleType;

    if (roleType === 'branch_admin') {
      const branchId = fullUser.branch?.id;
      const staff: any = await strapi.entityService.findOne('api::staff.staff', id, {
        populate: ['workLocation']
      });

      if (!staff) return ctx.notFound();

      if (staff.workLocation?.id !== branchId) {
        return ctx.forbidden('You can only delete staff in your own branch.');
      }

      return await super.delete(ctx);
    }

    const hasPermission = await checkUserPermission(strapi, user.id, 'api::staff.staff', 'delete');

    if (hasPermission) {
      return await super.delete(ctx);
    }

    return ctx.forbidden('You do not have permission to delete staff.');
  },
}));

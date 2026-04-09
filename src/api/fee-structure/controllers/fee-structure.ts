import { factories } from '@strapi/strapi';
import { canAccessAllBranches, getUserWithBranch } from '../../../utils/branch-access';
import { checkUserPermission } from '../../../utils/permission-checker';

export default factories.createCoreController('api::fee-structure.fee-structure', ({ strapi }) => ({
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
      const hasPermission = await checkUserPermission(strapi, user.id, 'api::fee-structure.fee-structure', 'find');
      if (!hasPermission) return ctx.forbidden('You do not have permission to view fee structures.');
      const branchId = fullUser.branch?.id;
      if (!branchId) {
        return ctx.send({ data: [], meta: { pagination: { total: 0 } } });
      }

      ctx.query.filters = {
        ...(ctx.query.filters as any),
        batch: {
          students: {
            branch: branchId
          }
        } as any,
      };

      return await super.find(ctx);
    }

    return ctx.forbidden('You do not have permission to view fee structures.');
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
      const hasPermission = await checkUserPermission(strapi, user.id, 'api::fee-structure.fee-structure', 'findOne');
      if (!hasPermission) return ctx.forbidden('You do not have permission to view this fee structure.');
      const branchId = fullUser.branch?.id;
      const feeStructure: any = await strapi.entityService.findOne('api::fee-structure.fee-structure', id, {
        populate: {
          batch: {
            students: {
              branch: true
            }
          }
        } as any,
      });

      if (!feeStructure) return ctx.notFound();

      const feeBranchId = feeStructure.batch?.students?.branch?.id;
      if (feeBranchId !== branchId) {
        return ctx.forbidden('Fee structure belongs to a different branch.');
      }

      return await super.findOne(ctx);
    }

    return ctx.forbidden('You do not have permission to view this fee structure.');
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
      const hasPermission = await checkUserPermission(strapi, user.id, 'api::fee-structure.fee-structure', 'create');
      if (!hasPermission) return ctx.forbidden('You do not have permission to create fee structures.');
      return await super.create(ctx);
    }

    return ctx.forbidden('You do not have permission to create fee structures.');
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
      const hasPermission = await checkUserPermission(strapi, user.id, 'api::fee-structure.fee-structure', 'update');
      if (!hasPermission) return ctx.forbidden('You do not have permission to update fee structures.');
      const branchId = fullUser.branch?.id;
      const feeStructure: any = await strapi.entityService.findOne('api::fee-structure.fee-structure', id, {
        populate: {
          batch: {
            students: {
              branch: true
            }
          }
        } as any,
      });

      if (!feeStructure) return ctx.notFound();

      const feeBranchId = feeStructure.batch?.students?.branch?.id;
      if (feeBranchId !== branchId) {
        return ctx.forbidden('You can only update fee structures in your own branch.');
      }

      return await super.update(ctx);
    }

    return ctx.forbidden('You do not have permission to update fee structures.');
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
      const hasPermission = await checkUserPermission(strapi, user.id, 'api::fee-structure.fee-structure', 'delete');
      if (!hasPermission) return ctx.forbidden('You do not have permission to delete fee structures.');
      const branchId = fullUser.branch?.id;
      const feeStructure: any = await strapi.entityService.findOne('api::fee-structure.fee-structure', id, {
        populate: {
          batch: {
            students: {
              branch: true
            }
          }
        } as any,
      });

      if (!feeStructure) return ctx.notFound();

      const feeBranchId = feeStructure.batch?.students?.branch?.id;
      if (feeBranchId !== branchId) {
        return ctx.forbidden('You can only delete fee structures in your own branch.');
      }

      return await super.delete(ctx);
    }

    return ctx.forbidden('You do not have permission to delete fee structures.');
  },
}));

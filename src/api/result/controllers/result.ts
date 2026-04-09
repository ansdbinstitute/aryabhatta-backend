import { factories } from '@strapi/strapi';
import { canAccessAllBranches, canViewAllBranchData, getUserWithBranch } from '../../../utils/branch-access';
import { checkUserPermission } from '../../../utils/permission-checker';

export default factories.createCoreController('api::result.result', ({ strapi }) => ({
  async find(ctx) {
    const user = ctx.state.user;

    if (!user) return await super.find(ctx);

    const hasAccessToAllData = await canViewAllBranchData(user.id);
    if (hasAccessToAllData) {
      return await super.find(ctx);
    }

    const fullUser = await getUserWithBranch(user.id);
    if (!fullUser) return await super.find(ctx);

    const roleType = fullUser.roleType;

    if (roleType === 'branch_admin') {
      const hasPermission = await checkUserPermission(strapi, user.id, 'api::result.result', 'find');
      if (!hasPermission) return ctx.forbidden('You do not have permission to view results.');
      const branchId = fullUser.branch?.id;
      if (!branchId) {
        return ctx.send({ data: [], meta: { pagination: { total: 0 } } });
      }

      ctx.query.filters = {
        ...(ctx.query.filters as any),
        student: {
          branch: branchId
        } as any,
      };

      return await super.find(ctx);
    }

    if (roleType === 'teacher') {
      const hasPermission = await checkUserPermission(strapi, user.id, 'api::result.result', 'find');
      if (!hasPermission) return ctx.forbidden('You do not have permission to view results.');
      const teacherBatches = await strapi.entityService.findMany('api::batch.batch', {
        filters: { teacher: user.id }
      });

      const batchIds = teacherBatches.map((b: any) => b.id);

      if (batchIds.length === 0) {
        return ctx.send({ data: [], meta: { pagination: { total: 0 } } });
      }

      ctx.query.filters = {
        ...(ctx.query.filters as any),
        exam: {
          batch: { $in: batchIds }
        } as any,
      };

      return await super.find(ctx);
    }

    if (roleType === 'student') {
      const studentProfile = await strapi.entityService.findMany('api::student.student', {
        filters: { user: user.id },
        fields: ['id']
      });

      if (!studentProfile.length) {
        return ctx.send({ data: [], meta: { pagination: { total: 0 } } });
      }

      ctx.query.filters = {
        ...(ctx.query.filters as any),
        student: studentProfile[0].id
      };

      return await super.find(ctx);
    }

    return ctx.forbidden('You do not have permission to view results.');
  },

  async findOne(ctx) {
    const { id } = ctx.params;
    const user = ctx.state.user;

    if (!user) return await super.findOne(ctx);

    const hasAccessToAllData = await canViewAllBranchData(user.id);
    if (hasAccessToAllData) {
      return await super.findOne(ctx);
    }

    const fullUser = await getUserWithBranch(user.id);
    if (!fullUser) return await super.findOne(ctx);

    const roleType = fullUser.roleType;

    if (roleType === 'branch_admin') {
      const hasPermission = await checkUserPermission(strapi, user.id, 'api::result.result', 'findOne');
      if (!hasPermission) return ctx.forbidden('You do not have permission to view this result.');
      const branchId = fullUser.branch?.id;
      const result: any = await strapi.entityService.findOne('api::result.result', id, {
        populate: {
          student: {
            branch: true
          }
        } as any,
      });

      if (!result) return ctx.notFound();

      const resultBranchId = result.student?.branch?.id;
      if (resultBranchId !== branchId) {
        return ctx.forbidden('Result belongs to a different branch.');
      }

      return await super.findOne(ctx);
    }

    return ctx.forbidden('You do not have permission to view this result.');
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

    if (roleType === 'branch_admin' || roleType === 'teacher') {
      const hasPermission = await checkUserPermission(strapi, user.id, 'api::result.result', 'create');
      if (!hasPermission) return ctx.forbidden('You do not have permission to create results.');
      return await super.create(ctx);
    }

    return ctx.forbidden('You do not have permission to create results.');
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
      const hasPermission = await checkUserPermission(strapi, user.id, 'api::result.result', 'update');
      if (!hasPermission) return ctx.forbidden('You do not have permission to update results.');
      const branchId = fullUser.branch?.id;
      const result: any = await strapi.entityService.findOne('api::result.result', id, {
        populate: {
          student: {
            branch: true
          }
        } as any,
      });

      if (!result) return ctx.notFound();

      const resultBranchId = result.student?.branch?.id;
      if (resultBranchId !== branchId) {
        return ctx.forbidden('You can only update results in your own branch.');
      }

      return await super.update(ctx);
    }

    if (roleType === 'teacher') {
      const hasPermission = await checkUserPermission(strapi, user.id, 'api::result.result', 'update');
      if (!hasPermission) return ctx.forbidden('You do not have permission to update results.');
      return await super.update(ctx);
    }

    return ctx.forbidden('You do not have permission to update results.');
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
      const hasPermission = await checkUserPermission(strapi, user.id, 'api::result.result', 'delete');
      if (!hasPermission) return ctx.forbidden('You do not have permission to delete results.');
      const branchId = fullUser.branch?.id;
      const result: any = await strapi.entityService.findOne('api::result.result', id, {
        populate: {
          student: {
            branch: true
          }
        } as any,
      });

      if (!result) return ctx.notFound();

      const resultBranchId = result.student?.branch?.id;
      if (resultBranchId !== branchId) {
        return ctx.forbidden('You can only delete results in your own branch.');
      }

      return await super.delete(ctx);
    }

    return ctx.forbidden('You do not have permission to delete results.');
  },
}));

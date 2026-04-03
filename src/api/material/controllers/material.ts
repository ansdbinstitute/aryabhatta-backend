import { factories } from '@strapi/strapi';
import { canAccessAllBranches, getUserWithBranch } from '../../../utils/branch-access';

export default factories.createCoreController('api::material.material', ({ strapi }) => ({
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
        batch: {
          students: {
            branch: branchId
          }
        } as any,
      };

      return await super.find(ctx);
    }

    if (roleType === 'teacher') {
      const teacherBatches = await strapi.entityService.findMany('api::batch.batch', {
        filters: { teacher: user.id }
      });

      const batchIds = teacherBatches.map((b: any) => b.id);

      if (batchIds.length === 0) {
        return ctx.send({ data: [], meta: { pagination: { total: 0 } } });
      }

      ctx.query.filters = {
        ...(ctx.query.filters as any),
        batch: { $in: batchIds }
      };

      return await super.find(ctx);
    }

    if (roleType === 'student') {
      const studentProfile: any = await strapi.entityService.findMany('api::student.student', {
        filters: { user: user.id },
        populate: ['batch']
      });

      if (!studentProfile.length || !studentProfile[0].batch) {
        return ctx.send({ data: [], meta: { pagination: { total: 0 } } });
      }

      ctx.query.filters = {
        ...(ctx.query.filters as any),
        $or: [
          { batch: studentProfile[0].batch.id },
          { isPublic: true }
        ]
      };

      return await super.find(ctx);
    }

    return ctx.forbidden('You do not have permission to view materials.');
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
      const material: any = await strapi.entityService.findOne('api::material.material', id, {
        populate: {
          batch: {
            students: {
              branch: true
            }
          }
        } as any,
      });

      if (!material) return ctx.notFound();

      const materialBranchId = material.batch?.students?.branch?.id;
      if (materialBranchId !== branchId) {
        return ctx.forbidden('Material belongs to a different branch.');
      }

      return await super.findOne(ctx);
    }

    return ctx.forbidden('You do not have permission to view this material.');
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
      return await super.create(ctx);
    }

    return ctx.forbidden('You do not have permission to create materials.');
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
      const material: any = await strapi.entityService.findOne('api::material.material', id, {
        populate: {
          batch: {
            students: {
              branch: true
            }
          }
        } as any,
      });

      if (!material) return ctx.notFound();

      const materialBranchId = material.batch?.students?.branch?.id;
      if (materialBranchId !== branchId) {
        return ctx.forbidden('You can only update materials in your own branch.');
      }

      return await super.update(ctx);
    }

    if (roleType === 'teacher') {
      return await super.update(ctx);
    }

    return ctx.forbidden('You do not have permission to update materials.');
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
      const material: any = await strapi.entityService.findOne('api::material.material', id, {
        populate: {
          batch: {
            students: {
              branch: true
            }
          }
        } as any,
      });

      if (!material) return ctx.notFound();

      const materialBranchId = material.batch?.students?.branch?.id;
      if (materialBranchId !== branchId) {
        return ctx.forbidden('You can only delete materials in your own branch.');
      }

      return await super.delete(ctx);
    }

    return ctx.forbidden('You do not have permission to delete materials.');
  },
}));

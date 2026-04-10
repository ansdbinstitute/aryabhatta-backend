import { factories } from '@strapi/strapi';
import { canAccessAllBranches, canViewAllBranchData, getUserWithBranch } from '../../../utils/branch-access';
import { checkUserPermission } from '../../../utils/permission-checker';

export default factories.createCoreController('api::exam.exam', ({ strapi }) => ({
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
      const hasPermission = await checkUserPermission(strapi, user.id, 'api::exam.exam', 'find');
      if (!hasPermission) return ctx.forbidden('You do not have permission to view exams.');
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
      const hasPermission = await checkUserPermission(strapi, user.id, 'api::exam.exam', 'find');
      if (!hasPermission) return ctx.forbidden('You do not have permission to view exams.');
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
        populate: ['course', 'batch']
      });

      if (!studentProfile.length) {
        return ctx.send({ data: [], meta: { pagination: { total: 0 } } });
      }

      const { course, batch } = studentProfile[0];
      
      // Students see exams for their course
      // If an exam is batch-specific, it must match their batch
      ctx.query.filters = {
        ...(ctx.query.filters as any),
        course: course?.id,
        $or: [
          { batch: { $null: true } },
          { batch: batch?.id }
        ]
      };

      return await super.find(ctx);
    }

    return ctx.forbidden('You do not have permission to view exams.');
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
      const hasPermission = await checkUserPermission(strapi, user.id, 'api::exam.exam', 'findOne');
      if (!hasPermission) return ctx.forbidden('You do not have permission to view this exam.');
      const branchId = fullUser.branch?.id;
      const exam: any = await strapi.entityService.findOne('api::exam.exam', id, {
        populate: {
          batch: {
            students: {
              branch: true
            }
          }
        } as any,
      });

      if (!exam) return ctx.notFound();

      const examBranchId = exam.batch?.students?.branch?.id;
      if (examBranchId !== branchId) {
        return ctx.forbidden('Exam belongs to a different branch.');
      }

      return await super.findOne(ctx);
    }

    if (roleType === 'student') {
      const exam: any = await strapi.entityService.findOne('api::exam.exam', id, {
        populate: ['course', 'batch']
      });

      if (!exam) return ctx.notFound();

      const studentProfile: any = await strapi.entityService.findMany('api::student.student', {
        filters: { user: user.id },
        populate: ['course', 'batch']
      });

      if (!studentProfile.length) return ctx.forbidden();

      const { course, batch } = studentProfile[0];

      // Check if exam belongs to student's course
      if (exam.course?.id !== course?.id) {
        return ctx.forbidden('Exam belongs to a different course.');
      }

      // If exam is batch-specific, check if it matches student's batch
      if (exam.batch && exam.batch.id !== batch?.id) {
        return ctx.forbidden('Exam belongs to a different batch.');
      }

      return await super.findOne(ctx);
    }

    return ctx.forbidden('You do not have permission to view this exam.');
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
      const hasPermission = await checkUserPermission(strapi, user.id, 'api::exam.exam', 'create');
      if (!hasPermission) return ctx.forbidden('You do not have permission to create exams.');
      return await super.create(ctx);
    }

    return ctx.forbidden('You do not have permission to create exams.');
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
      const hasPermission = await checkUserPermission(strapi, user.id, 'api::exam.exam', 'update');
      if (!hasPermission) return ctx.forbidden('You do not have permission to update exams.');
      const branchId = fullUser.branch?.id;
      const exam: any = await strapi.entityService.findOne('api::exam.exam', id, {
        populate: {
          batch: {
            students: {
              branch: true
            }
          }
        } as any,
      });

      if (!exam) return ctx.notFound();

      const examBranchId = exam.batch?.students?.branch?.id;
      if (examBranchId !== branchId) {
        return ctx.forbidden('You can only update exams in your own branch.');
      }

      return await super.update(ctx);
    }

    if (roleType === 'teacher') {
      const hasPermission = await checkUserPermission(strapi, user.id, 'api::exam.exam', 'update');
      if (!hasPermission) return ctx.forbidden('You do not have permission to update exams.');
      return await super.update(ctx);
    }

    return ctx.forbidden('You do not have permission to update exams.');
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
      const hasPermission = await checkUserPermission(strapi, user.id, 'api::exam.exam', 'delete');
      if (!hasPermission) return ctx.forbidden('You do not have permission to delete exams.');
      const branchId = fullUser.branch?.id;
      const exam: any = await strapi.entityService.findOne('api::exam.exam', id, {
        populate: {
          batch: {
            students: {
              branch: true
            }
          }
        } as any,
      });

      if (!exam) return ctx.notFound();

      const examBranchId = exam.batch?.students?.branch?.id;
      if (examBranchId !== branchId) {
        return ctx.forbidden('You can only delete exams in your own branch.');
      }

      return await super.delete(ctx);
    }

    return ctx.forbidden('You do not have permission to delete exams.');
  },
}));

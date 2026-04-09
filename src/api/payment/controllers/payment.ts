import { factories } from '@strapi/strapi';
import { checkUserPermission } from '../../../utils/permission-checker';
import { canAccessAllBranches, getUserWithBranch } from '../../../utils/branch-access';

export default factories.createCoreController('api::payment.payment', ({ strapi }) => ({
  async find(ctx) {
    const user = ctx.state.user;

    if (!user) return await super.find(ctx);

    const fullUser = await getUserWithBranch(user.id);
    if (!fullUser) return await super.find(ctx);

    const roleType = fullUser.roleType;

    const hasAccessToAll = await canAccessAllBranches(user.id);
    if (hasAccessToAll) {
      return await super.find(ctx);
    }

    if (roleType === 'branch_admin') {
      const hasPermission = await checkUserPermission(strapi, user.id, 'api::payment.payment', 'find');
      if (!hasPermission) return ctx.forbidden('You do not have permission to view payments.');
      const branchId = fullUser.branch?.id;
      if (!branchId) {
        return ctx.send({ data: [], meta: { pagination: { total: 0 } } });
      }

      ctx.query.filters = {
        ...(ctx.query.filters as any),
        branch: branchId
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

    const hasPermission = await checkUserPermission(strapi, user.id, 'api::payment.payment', 'find');

    if (hasPermission) {
      const branchId = fullUser.branch?.id;
      if (branchId) {
        ctx.query.filters = {
          ...(ctx.query.filters as any),
          branch: branchId
        };
      }
      return await super.find(ctx);
    }

    return ctx.forbidden('You do not have permission to view payments.');
  },

  async findOne(ctx) {
    const { id } = ctx.params;
    const user = ctx.state.user;

    if (!user) return await super.findOne(ctx);

    const fullUser = await getUserWithBranch(user.id);
    if (!fullUser) return await super.findOne(ctx);

    const roleType = fullUser.roleType;

    const hasAccessToAll = await canAccessAllBranches(user.id);
    if (hasAccessToAll) {
      return await super.findOne(ctx);
    }

    if (roleType === 'branch_admin') {
      const hasPermission = await checkUserPermission(strapi, user.id, 'api::payment.payment', 'findOne');
      if (!hasPermission) return ctx.forbidden('You do not have permission to view this payment.');
      const branchId = fullUser.branch?.id;
      const payment: any = await strapi.entityService.findOne('api::payment.payment', id, {
        populate: ['branch']
      });

      if (!payment) return ctx.notFound();

      if (payment.branch?.id !== branchId) {
        return ctx.forbidden('Payment belongs to a different branch.');
      }

      return await super.findOne(ctx);
    }

    if (roleType === 'student') {
      const studentProfile = await strapi.entityService.findMany('api::student.student', {
        filters: { user: user.id },
        fields: ['id']
      });

      if (!studentProfile.length) return ctx.notFound();

      const payment: any = await strapi.entityService.findOne('api::payment.payment', id, {
        populate: ['student']
      });

      if (!payment || payment.student?.id !== studentProfile[0].id) {
         return ctx.forbidden('You can only view your own payments.');
      }

      return await super.findOne(ctx);
    }

    const hasPermission = await checkUserPermission(strapi, user.id, 'api::payment.payment', 'findOne');

    if (hasPermission) {
      return await super.findOne(ctx);
    }

    return ctx.forbidden('You do not have permission to view this payment.');
  },

  async create(ctx) {
    const user = ctx.state.user;

    if (!user) return await super.create(ctx);

    const fullUser = await getUserWithBranch(user.id);
    if (!fullUser) return await super.create(ctx);

    const roleType = fullUser.roleType;

    const hasAccessToAll = await canAccessAllBranches(user.id);
    if (hasAccessToAll) {
      return await super.create(ctx);
    }

    if (roleType === 'branch_admin') {
      const hasPermission = await checkUserPermission(strapi, user.id, 'api::payment.payment', 'create');
      if (!hasPermission) return ctx.forbidden('You do not have permission to create payments.');
      const branchId = fullUser.branch?.id;
      if (branchId) {
        ctx.request.body.data.branch = branchId;
        ctx.request.body.data.recordedBy = user.id;
      }
      return await super.create(ctx);
    }

    const hasPermission = await checkUserPermission(strapi, user.id, 'api::payment.payment', 'create');

    if (hasPermission) {
      ctx.request.body.data.recordedBy = user.id;
      return await super.create(ctx);
    }

    return ctx.forbidden('You do not have permission to create payments.');
  },

  async update(ctx) {
    const user = ctx.state.user;
    const { id } = ctx.params;

    if (!user) return await super.update(ctx);

    const fullUser = await getUserWithBranch(user.id);
    if (!fullUser) return await super.update(ctx);

    const roleType = fullUser.roleType;

    const hasAccessToAll = await canAccessAllBranches(user.id);
    if (hasAccessToAll) {
      return await super.update(ctx);
    }

    if (roleType === 'branch_admin') {
      const hasPermission = await checkUserPermission(strapi, user.id, 'api::payment.payment', 'update');
      if (!hasPermission) return ctx.forbidden('You do not have permission to update payments.');
      const branchId = fullUser.branch?.id;
      const payment: any = await strapi.entityService.findOne('api::payment.payment', id, {
        populate: ['branch']
      });

      if (!payment) return ctx.notFound();

      if (payment.branch?.id !== branchId) {
        return ctx.forbidden('You can only update payments in your own branch.');
      }

      return await super.update(ctx);
    }

    const hasPermission = await checkUserPermission(strapi, user.id, 'api::payment.payment', 'update');

    if (hasPermission) {
      return await super.update(ctx);
    }

    return ctx.forbidden('You do not have permission to update payments.');
  },

  async delete(ctx) {
    const user = ctx.state.user;
    const { id } = ctx.params;

    if (!user) return await super.delete(ctx);

    const fullUser = await getUserWithBranch(user.id);
    if (!fullUser) return await super.delete(ctx);

    const roleType = fullUser.roleType;

    const hasAccessToAll = await canAccessAllBranches(user.id);
    if (hasAccessToAll) {
      return await super.delete(ctx);
    }

    if (roleType === 'branch_admin') {
      const hasPermission = await checkUserPermission(strapi, user.id, 'api::payment.payment', 'delete');
      if (!hasPermission) return ctx.forbidden('You do not have permission to delete payments.');
      const branchId = fullUser.branch?.id;
      const payment: any = await strapi.entityService.findOne('api::payment.payment', id, {
        populate: ['branch']
      });

      if (!payment) return ctx.notFound();

      if (payment.branch?.id !== branchId) {
        return ctx.forbidden('You can only delete payments in your own branch.');
      }

      return await super.delete(ctx);
    }

    const hasPermission = await checkUserPermission(strapi, user.id, 'api::payment.payment', 'delete');

    if (hasPermission) {
      return await super.delete(ctx);
    }

    return ctx.forbidden('You do not have permission to delete payments.');
  },
}));

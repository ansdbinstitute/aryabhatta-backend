import { factories } from '@strapi/strapi';
import { canAccessAllBranches, getUserWithBranch } from '../../../utils/branch-access';

export default factories.createCoreController('api::student-testimonial.student-testimonial' as any, ({ strapi }) => ({
  async find(ctx) {
    const user = ctx.state.user;

    if (!user) {
      ctx.query.filters = {
        ...(ctx.query.filters as any),
        isActive: true
      };
      ctx.query.sort = 'displayOrder:asc,createdAt:desc';
      return await super.find(ctx);
    }

    const fullUser = await getUserWithBranch(user.id);
    if (!fullUser) {
      ctx.query.filters = {
        ...(ctx.query.filters as any),
        isActive: true
      };
      ctx.query.sort = 'displayOrder:asc,createdAt:desc';
      return await super.find(ctx);
    }

    const roleType = fullUser.roleType;
    const hasAccessToAll = await canAccessAllBranches(user.id);

    if (hasAccessToAll || roleType === 'institute_admin') {
      ctx.query.sort = 'displayOrder:asc,createdAt:desc';
      return await super.find(ctx);
    }

    ctx.query.filters = {
      ...(ctx.query.filters as any),
      isActive: true
    };
    ctx.query.sort = 'displayOrder:asc,createdAt:desc';
    return await super.find(ctx);
  },

  async findOne(ctx) {
    const user = ctx.state.user;
    const { id } = ctx.params;

    if (!user) {
      ctx.query.filters = {
        ...(ctx.query.filters as any),
        isActive: true
      };
      return await super.findOne(ctx);
    }

    const fullUser = await getUserWithBranch(user.id);
    if (!fullUser) {
      ctx.query.filters = {
        ...(ctx.query.filters as any),
        isActive: true
      };
      return await super.findOne(ctx);
    }

    const roleType = fullUser.roleType;
    const hasAccessToAll = await canAccessAllBranches(user.id);

    if (hasAccessToAll || roleType === 'institute_admin') {
      return await super.findOne(ctx);
    }

    ctx.query.filters = {
      ...(ctx.query.filters as any),
      isActive: true
    };
    return await super.findOne(ctx);
  },

  async create(ctx) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    const fullUser = await getUserWithBranch(user.id);
    if (!fullUser) {
      return ctx.unauthorized('User not found');
    }

    const roleType = fullUser.roleType;

    if (roleType !== 'institute_admin') {
      return ctx.forbidden('Only Institute Admin can create testimonials');
    }

    return await super.create(ctx);
  },

  async update(ctx) {
    const user = ctx.state.user;
    const { id } = ctx.params;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    const fullUser = await getUserWithBranch(user.id);
    if (!fullUser) {
      return ctx.unauthorized('User not found');
    }

    const roleType = fullUser.roleType;

    if (roleType !== 'institute_admin') {
      return ctx.forbidden('Only Institute Admin can update testimonials');
    }

    return await super.update(ctx);
  },

  async delete(ctx) {
    const user = ctx.state.user;
    const { id } = ctx.params;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    const fullUser = await getUserWithBranch(user.id);
    if (!fullUser) {
      return ctx.unauthorized('User not found');
    }

    const roleType = fullUser.roleType;

    if (roleType !== 'institute_admin') {
      return ctx.forbidden('Only Institute Admin can delete testimonials');
    }

    return await super.delete(ctx);
  },
}));

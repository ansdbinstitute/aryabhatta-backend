import { factories } from '@strapi/strapi';
import { canAccessAllBranches } from '../../../utils/branch-access';

export default factories.createCoreController('api::course.course', ({ strapi }) => ({
  async find(ctx) {
    return await super.find(ctx);
  },

  async findOne(ctx) {
    return await super.findOne(ctx);
  },

  async create(ctx) {
    const user = ctx.state.user;

    if (!user) return await super.create(ctx);

    const hasAccessToAll = await canAccessAllBranches(user.id);
    if (hasAccessToAll) {
      return await super.create(ctx);
    }

    return ctx.forbidden('Only Institute Admin can create courses.');
  },

  async update(ctx) {
    const user = ctx.state.user;

    if (!user) return await super.update(ctx);

    const hasAccessToAll = await canAccessAllBranches(user.id);
    if (hasAccessToAll) {
      return await super.update(ctx);
    }

    return ctx.forbidden('Only Institute Admin can update courses.');
  },

  async delete(ctx) {
    const user = ctx.state.user;

    if (!user) return await super.delete(ctx);

    const hasAccessToAll = await canAccessAllBranches(user.id);
    if (hasAccessToAll) {
      return await super.delete(ctx);
    }

    return ctx.forbidden('Only Institute Admin can delete courses.');
  },
}));

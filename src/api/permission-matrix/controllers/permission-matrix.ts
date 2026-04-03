const AVAILABLE_CONTENT_TYPES = [
  { uid: 'api::student.student', name: 'Student', actions: ['find', 'findOne', 'create', 'update', 'delete'] },
  { uid: 'api::staff.staff', name: 'Staff', actions: ['find', 'findOne', 'create', 'update', 'delete'] },
  { uid: 'api::payment.payment', name: 'Payment', actions: ['find', 'findOne', 'create', 'update', 'delete'] },
  { uid: 'api::attendance.attendance', name: 'Attendance', actions: ['find', 'findOne', 'create', 'update'] },
  { uid: 'api::result.result', name: 'Result', actions: ['find', 'findOne', 'create', 'update'] },
  { uid: 'api::fee-structure.fee-structure', name: 'Fee Structure', actions: ['find', 'findOne', 'create', 'update', 'delete'] },
  { uid: 'api::notice.notice', name: 'Notice', actions: ['find', 'findOne', 'create', 'update', 'delete'] },
  { uid: 'api::course.course', name: 'Course', actions: ['find', 'findOne', 'create', 'update', 'delete'] },
  { uid: 'api::branch.branch', name: 'Branch', actions: ['find', 'findOne'] },
  { uid: 'api::batch.batch', name: 'Batch', actions: ['find', 'findOne', 'create', 'update', 'delete'] },
  { uid: 'api::exam.exam', name: 'Exam', actions: ['find', 'findOne', 'create', 'update', 'delete'] },
  { uid: 'api::material.material', name: 'Material', actions: ['find', 'findOne', 'create', 'update', 'delete'] },
];

export default {
  async getAvailableContentTypes(ctx) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    const fullUser: any = await strapi.entityService.findOne('plugin::users-permissions.user', user.id, {
      populate: ['branch']
    });

    const roleType = fullUser.roleType;

    if (roleType === 'institute_admin' || roleType === 'branch_admin') {
      return ctx.send({ data: AVAILABLE_CONTENT_TYPES });
    }

    return ctx.send({ data: AVAILABLE_CONTENT_TYPES.filter(ct => 
      ['api::student.student', 'api::attendance.attendance', 'api::result.result'].includes(ct.uid)
    ) });
  },

  async getUserPermissions(ctx) {
    const { id } = ctx.params;
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    const fullUser: any = await strapi.entityService.findOne('plugin::users-permissions.user', user.id, {
      populate: ['branch']
    });

    const roleType = fullUser.roleType;

    if (roleType === 'institute_admin') {
      const targetUser: any = await strapi.entityService.findOne('plugin::users-permissions.user', id);
      if (!targetUser) {
        return ctx.notFound('User not found');
      }
    } else if (roleType === 'branch_admin') {
      const targetUser: any = await strapi.entityService.findOne('plugin::users-permissions.user', id, {
        populate: ['branch']
      });
      if (!targetUser) {
        return ctx.notFound('User not found');
      }
      if (targetUser.roleType === 'institute_admin') {
        return ctx.forbidden('Access denied');
      }
      if (targetUser.branch?.id !== fullUser.branch?.id) {
        return ctx.forbidden('You can only view permissions for users in your branch');
      }
    } else {
      return ctx.forbidden('Only Institute Admin and Branch Admin can view permissions');
    }

    const permissions = await strapi.entityService.findMany('api::permission-matrix.permission-matrix', {
      filters: { user: id }
    });

    return ctx.send({ data: permissions });
  },

  async setUserPermissions(ctx) {
    const { id } = ctx.params;
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    const fullUser: any = await strapi.entityService.findOne('plugin::users-permissions.user', user.id, {
      populate: ['branch']
    });

    const roleType = fullUser.roleType;

    const targetUser: any = await strapi.entityService.findOne('plugin::users-permissions.user', id, {
      populate: ['branch']
    });

    if (!targetUser) {
      return ctx.notFound('User not found');
    }

    if (targetUser.roleType === 'institute_admin') {
      return ctx.forbidden('Cannot set permissions for Institute Admin. Contact ERP Admin.');
    }

    if (roleType === 'branch_admin') {
      if (targetUser.roleType === 'institute_admin') {
        return ctx.forbidden('Access denied');
      }
      if (targetUser.branch?.id !== fullUser.branch?.id) {
        return ctx.forbidden('You can only set permissions for users in your branch');
      }
    } else if (roleType !== 'institute_admin') {
      return ctx.forbidden('Only Institute Admin and Branch Admin can set permissions');
    }

    const { contentType, actions } = ctx.request.body;

    if (!contentType || !actions) {
      return ctx.badRequest('contentType and actions are required');
    }

    const existingPermissions = await strapi.entityService.findMany('api::permission-matrix.permission-matrix', {
      filters: { user: id }
    });

    const existingForType = existingPermissions.find((pm: any) => 
      pm.allowedContentTypes?.includes(contentType)
    );

    let permission;
    if (existingForType) {
      permission = await strapi.entityService.update('api::permission-matrix.permission-matrix', existingForType.id, {
        data: {
          allowedActions: actions
        }
      });
    } else {
      permission = await strapi.entityService.create('api::permission-matrix.permission-matrix', {
        data: {
          user: id,
          allowedContentTypes: [contentType],
          allowedActions: actions,
          assignedBy: user.id
        }
      });
    }

    return ctx.send({ data: permission });
  },

  async removeUserPermission(ctx) {
    const { id, permissionId } = ctx.params;
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    const fullUser: any = await strapi.entityService.findOne('plugin::users-permissions.user', user.id);

    const roleType = fullUser.roleType;

    if (roleType !== 'institute_admin' && roleType !== 'branch_admin') {
      return ctx.forbidden('Only Institute Admin and Branch Admin can remove permissions');
    }

    await strapi.entityService.delete('api::permission-matrix.permission-matrix', permissionId);

    return ctx.send({ message: 'Permission removed successfully' });
  },
};

import { isMainBranch } from '../../../utils/branch-access';

export default {
  async find(ctx) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    const fullUser: any = await strapi.entityService.findOne('plugin::users-permissions.user', user.id, {
      populate: ['branch']
    });

    const roleType = fullUser.roleType;

    if (roleType !== 'institute_admin') {
      return ctx.forbidden('Only Institute Admin can view all users');
    }

    const { page, pageSize, ...filters } = ctx.query;
    
    const users = await strapi.entityService.findMany('plugin::users-permissions.user', {
      filters: { roleType: { $ne: 'student' } },
      populate: ['branch', 'role'],
      page: page || 1,
      pageSize: pageSize || 100,
      ...filters
    });

    return ctx.send({ data: users, meta: {} });
  },

  async findOne(ctx) {
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
      populate: ['branch', 'role', 'profileImage']
    });

    if (!targetUser) {
      return ctx.notFound('User not found');
    }

    if (roleType === 'institute_admin') {
      return ctx.send({ data: targetUser });
    }

    return ctx.forbidden('Access denied');
  },

  async create(ctx) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    const fullUser: any = await strapi.entityService.findOne('plugin::users-permissions.user', user.id, {
      populate: ['branch']
    });

    const roleType = fullUser.roleType;

    if (roleType !== 'institute_admin') {
      return ctx.forbidden('Only Institute Admin can create users');
    }

    const { username, email, password, firstName, lastName, phone, roleType: newUserRoleType, branch: branchId } = ctx.request.body;

    if (!username || !email || !password || !newUserRoleType) {
      return ctx.badRequest('Username, email, password, and roleType are required');
    }

    if (newUserRoleType === 'institute_admin') {
      return ctx.forbidden('Cannot create Institute Admin from frontend. Contact ERP Admin.');
    }

    const roles = await strapi.entityService.findMany('plugin::users-permissions.role');
    const authenticatedRole = roles.find((r: any) => r.type === 'authenticated');

    const userService = strapi.plugins['users-permissions'].services.user;

    const existingUser = await strapi.entityService.findMany('plugin::users-permissions.user', {
      filters: { email: email.toLowerCase().trim() }
    });
    if (existingUser && existingUser.length > 0) {
      return ctx.badRequest('This email is already registered to another account (Staff or Student).');
    }

    const existingUsername = await strapi.entityService.findMany('plugin::users-permissions.user', {
      filters: { username: username.toLowerCase().trim() }
    });
    if (existingUsername && existingUsername.length > 0) {
      return ctx.badRequest('This username is already taken. Please choose a different one.');
    }

    const newUser: any = await userService.add({
      username,
      email,
      password,
      firstName,
      lastName,
      phone,
      provider: 'local',
      confirmed: true,
      role: authenticatedRole?.id,
      roleType: newUserRoleType,
      branch: branchId || fullUser.branch?.id,
      isActive: true
    });

    const { password: _, ...safeUser } = newUser;

    return ctx.created({ data: safeUser });
  },

  async update(ctx) {
    const { id } = ctx.params;
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    const fullUser: any = await strapi.entityService.findOne('plugin::users-permissions.user', user.id, {
      populate: ['branch']
    });

    const roleType = fullUser.roleType;

    if (roleType !== 'institute_admin') {
      return ctx.forbidden('Only Institute Admin can update users');
    }

    const targetUser: any = await strapi.entityService.findOne('plugin::users-permissions.user', id);

    if (!targetUser) {
      return ctx.notFound('User not found');
    }

    if (targetUser.roleType === 'institute_admin') {
      return ctx.forbidden('Cannot modify Institute Admin. Contact ERP Admin.');
    }

    const updateData: any = {};
    const { firstName, lastName, phone, branch, isActive, email, profileImage } = ctx.request.body;

    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;
    if (branch !== undefined) updateData.branch = branch;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (email !== undefined) updateData.email = email;
    if (profileImage !== undefined) updateData.profileImage = profileImage;

    const updatedUser = await strapi.entityService.update('plugin::users-permissions.user', id, {
      data: updateData
    });

    return ctx.send({ data: updatedUser });
  },

  async updateMe(ctx) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    const { firstName, lastName, phone, email, profileImage } = ctx.request.body;
    const updateData: any = {};

    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (profileImage !== undefined) updateData.profileImage = profileImage;

    const updatedUser = await strapi.entityService.update('plugin::users-permissions.user', user.id, {
      data: updateData,
      populate: ['branch', 'role', 'profileImage']
    });

    return ctx.send({ data: updatedUser });
  },

  async delete(ctx) {
    const { id } = ctx.params;
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    const fullUser: any = await strapi.entityService.findOne('plugin::users-permissions.user', user.id);

    if (fullUser.roleType !== 'institute_admin') {
      return ctx.forbidden('Only Institute Admin can delete users');
    }

    const targetUser: any = await strapi.entityService.findOne('plugin::users-permissions.user', id);

    if (!targetUser) {
      return ctx.notFound('User not found');
    }

    if (targetUser.roleType === 'institute_admin') {
      return ctx.forbidden('Cannot delete Institute Admin. Contact ERP Admin.');
    }

    await strapi.entityService.delete('plugin::users-permissions.user', id);

    return ctx.send({ data: { id: parseInt(id) } });
  },

  async changeRole(ctx) {
    const { id } = ctx.params;
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    const fullUser: any = await strapi.entityService.findOne('plugin::users-permissions.user', user.id);

    const roleType = fullUser.roleType;

    if (roleType !== 'institute_admin') {
      return ctx.forbidden('Only Institute Admin can change user roles');
    }

    const { roleType: newRoleType } = ctx.request.body;

    if (!newRoleType) {
      return ctx.badRequest('roleType is required');
    }

    if (newRoleType === 'institute_admin') {
      return ctx.forbidden('Cannot change role to Institute Admin. Contact ERP Admin.');
    }

    const targetUser: any = await strapi.entityService.findOne('plugin::users-permissions.user', id);

    if (!targetUser) {
      return ctx.notFound('User not found');
    }

    if (targetUser.roleType === 'institute_admin') {
      return ctx.forbidden('Cannot change Institute Admin role. Contact ERP Admin.');
    }

    const updatedUser = await strapi.entityService.update('plugin::users-permissions.user', id, {
      data: { roleType: newRoleType }
    });

    return ctx.send({ data: updatedUser });
  },

  async changePassword(ctx) {
    const { id } = ctx.params;
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    const fullUser: any = await strapi.entityService.findOne('plugin::users-permissions.user', user.id, {
      populate: ['branch']
    });

    const { password, confirmPassword } = ctx.request.body;

    if (!password || !confirmPassword) {
      return ctx.badRequest('Password and confirmPassword are required');
    }

    if (password !== confirmPassword) {
      return ctx.badRequest('Passwords do not match');
    }

    if (password.length < 6) {
      return ctx.badRequest('Password must be at least 6 characters');
    }

    const roleType = fullUser.roleType;

    if (roleType === 'institute_admin') {
      if (parseInt(id) !== user.id) {
        const targetUser: any = await strapi.entityService.findOne('plugin::users-permissions.user', id);
        if (targetUser.roleType === 'institute_admin') {
          return ctx.forbidden('Cannot change Institute Admin password. Contact ERP Admin.');
        }
      }
      const updatedUser = await strapi.entityService.update('plugin::users-permissions.user', id, {
        data: { password }
      } as any);
      return ctx.send({ message: 'Password updated successfully' });
    }

    return ctx.forbidden('Only Institute Admin can change passwords');
  },

  async changeMyPassword(ctx) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    const { password, confirmPassword } = ctx.request.body;

    if (!password || !confirmPassword) {
      return ctx.badRequest('Password and confirmPassword are required');
    }

    if (password !== confirmPassword) {
      return ctx.badRequest('Passwords do not match');
    }

    if (password.length < 6) {
      return ctx.badRequest('Password must be at least 6 characters');
    }

    await strapi.entityService.update('plugin::users-permissions.user', user.id, {
      data: { password }
    } as any);

    return ctx.send({ message: 'Password updated successfully' });
  },

  async getBranches(ctx) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    const fullUser: any = await strapi.entityService.findOne('plugin::users-permissions.user', user.id, {
      populate: ['branch']
    });

    const roleType = fullUser.roleType;

    if (roleType !== 'institute_admin') {
      return ctx.forbidden('Only Institute Admin can view all branches');
    }

    const branches = await strapi.entityService.findMany('api::branch.branch');

    return ctx.send({ data: branches });
  },

  async getRoleTypes(ctx) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    const fullUser: any = await strapi.entityService.findOne('plugin::users-permissions.user', user.id);

    if (fullUser?.roleType !== 'institute_admin') {
      return ctx.forbidden('Only Institute Admin can view role types');
    }

    const roleTypes = [
      { value: 'branch_admin', label: 'Branch Admin' },
      { value: 'teacher', label: 'Teacher' },
      { value: 'accountant', label: 'Accountant' }
    ];

    return ctx.send({ data: roleTypes });
  },

  async updateBranchAccess(ctx) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    const fullUser: any = await strapi.entityService.findOne('plugin::users-permissions.user', user.id, {
      populate: ['branch']
    });

    const roleType = fullUser.roleType;

    if (roleType !== 'institute_admin') {
      return ctx.forbidden('Only Institute Admin can manage branch access permissions.');
    }

    const { userId, canViewAllBranches } = ctx.request.body;

    if (!userId) {
      return ctx.badRequest('userId is required');
    }

    if (typeof canViewAllBranches !== 'boolean') {
      return ctx.badRequest('canViewAllBranches must be a boolean');
    }

    const targetUser: any = await strapi.entityService.findOne('plugin::users-permissions.user', userId, {
      populate: ['branch']
    });

    if (!targetUser) {
      return ctx.notFound('User not found');
    }

    if (targetUser.roleType !== 'teacher') {
      return ctx.badRequest('Cross-branch visibility can only be granted to teacher users.');
    }

    if (!isMainBranch(targetUser.branch)) {
      return ctx.badRequest('Cross-branch visibility can only be granted to teachers under the main branch.');
    }

    const updatedUser = await strapi.entityService.update('plugin::users-permissions.user', userId, {
      data: { canViewAllBranches }
    });

    const { password: _, ...safeUser } = updatedUser;

    return ctx.send({ 
      data: safeUser,
      message: `Teacher visibility updated successfully. User can now ${canViewAllBranches ? 'view all branches' : 'view only their own branch'}.`
    });
  },

  async getBranchAccess(ctx) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    const fullUser: any = await strapi.entityService.findOne('plugin::users-permissions.user', user.id, {
      populate: ['branch']
    });

    const roleType = fullUser.roleType;

    if (roleType !== 'institute_admin') {
      return ctx.forbidden('Only Institute Admin can view branch access permissions.');
    }

    const usersWithAccess = await strapi.entityService.findMany('plugin::users-permissions.user', {
      filters: { 
        roleType: 'teacher',
        canViewAllBranches: true
      },
      populate: ['branch']
    });

    return ctx.send({ data: usersWithAccess });
  },
};

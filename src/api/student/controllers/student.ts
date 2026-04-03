import { factories } from '@strapi/strapi';
import { checkUserPermission } from '../../../utils/permission-checker';
import { canAccessAllBranches, getUserWithBranch } from '../../../utils/branch-access';

export default factories.createCoreController('api::student.student', ({ strapi }) => ({
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

    if (roleType === 'teacher') {
      // canAccessAllBranches already checked above for teachers
      // If teacher is from main branch OR has canViewAllBranches permission, see all students
      if (hasAccessToAll) {
        return await super.find(ctx);
      }
      
      // Otherwise, see all students in their own branch
      const branchId = fullUser.branch?.id;
      if (branchId) {
        ctx.query.filters = {
          ...(ctx.query.filters as any),
          branch: branchId
        };
      }
      return await super.find(ctx);
    }

    const hasPermission = await checkUserPermission(strapi, user.id, 'api::student.student', 'find');

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

    return ctx.forbidden('You do not have permission to view students.');
  },

  async me(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    // Find student by user relation
    const students: any = await strapi.entityService.findMany('api::student.student', {
      filters: { user: user.id },
      populate: ['course', 'batch', 'user', 'profileImage', 'idCardFront', 'idCardBack', 'certificate', 'branch'],
      pagination: { pageSize: 1 },
    });

    if (!students || students.length === 0) {
      return ctx.notFound('Student record not found');
    }

    return ctx.send({ data: students[0] });
  },

  async findOne(ctx) {
    const user = ctx.state.user;
    const { id } = ctx.params;

    if (!user) return await super.findOne(ctx);

    const fullUser = await getUserWithBranch(user.id);
    if (!fullUser) return await super.findOne(ctx);

    const roleType = fullUser.roleType;

    const hasAccessToAll = await canAccessAllBranches(user.id);
    if (hasAccessToAll) {
      return await super.findOne(ctx);
    }

    if (roleType === 'branch_admin') {
      const branchId = fullUser.branch?.id;
      const student: any = await strapi.entityService.findOne('api::student.student', id, {
        populate: ['branch']
      });

      if (!student) return ctx.notFound();

      if (student.branch?.id !== branchId) {
        return ctx.forbidden('Student belongs to a different branch.');
      }

      return await super.findOne(ctx);
    }

    const hasPermission = await checkUserPermission(strapi, user.id, 'api::student.student', 'findOne');

    if (hasPermission) {
      return await super.findOne(ctx);
    }

    return ctx.forbidden('You do not have permission to view this student.');
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
      const branchId = fullUser.branch?.id;
      if (branchId) {
        ctx.request.body.data.branch = branchId;
      }
      return await super.create(ctx);
    }

    const hasPermission = await checkUserPermission(strapi, user.id, 'api::student.student', 'create');

    if (hasPermission) {
      return await super.create(ctx);
    }

    return ctx.forbidden('You do not have permission to create students.');
  },

  async update(ctx) {
    const user = ctx.state.user;
    const { id } = ctx.params;
    const { data } = ctx.request.body || {};

    if (!user) return await super.update(ctx);

    const fullUser = await getUserWithBranch(user.id);
    if (!fullUser) return await super.update(ctx);

    const roleType = fullUser.roleType;

    const hasAccessToAll = await canAccessAllBranches(user.id);
    if (hasAccessToAll) {
      return await this.customUpdate.call({ strapi }, ctx);
    }

    if (roleType === 'branch_admin') {
      const branchId = fullUser.branch?.id;
      const student: any = await strapi.entityService.findOne('api::student.student', id, {
        populate: ['branch']
      });

      if (!student) return ctx.notFound();

      if (student.branch?.id !== branchId) {
        return ctx.forbidden('You can only update students in your own branch.');
      }

      return await this.customUpdate.call({ strapi }, ctx);
    }

    const hasPermission = await checkUserPermission(strapi, user.id, 'api::student.student', 'update');

    if (hasPermission) {
      return await this.customUpdate.call({ strapi }, ctx);
    }

    return ctx.forbidden('You do not have permission to update students.');
  },

  async customUpdate(ctx: any) {
    const { id } = ctx.params;
    
    // Extract data from request body - handle both formats
    const body = ctx.request.body || {};
    const requestData = body.data || body;
    
    const mediaFields = ['profileImage', 'idCardFront', 'idCardBack', 'certificate'];
    const relationFields = ['course', 'batch', 'branch', 'user'];
    
    const mediaUpdates: Record<string, any> = {};
    const dataFields: Record<string, any> = {};

    // Extract fields by type
    if (requestData && typeof requestData === 'object') {
      for (const [key, value] of Object.entries(requestData)) {
        if (mediaFields.includes(key)) {
          // Handle media field - extract the file ID
          if (value && typeof value === 'object' && value !== null) {
            mediaUpdates[key] = (value as any).id || null;
          } else if (typeof value === 'number') {
            mediaUpdates[key] = value;
          } else if (value === null) {
            mediaUpdates[key] = null;
          }
        } else if (relationFields.includes(key)) {
          // Skip relation fields - we'll handle them separately with proper format
          // The frontend sends { documentId: "..." } format which entityService can handle
          dataFields[key] = value;
        } else {
          // Regular data fields
          dataFields[key] = value;
        }
      }
    }

    strapi.log.info(`[Student Update] Processing update for ${id}`);
    strapi.log.info(`[Student Update] Data fields: ${JSON.stringify(dataFields)}`);
    strapi.log.info(`[Student Update] Media fields: ${JSON.stringify(mediaUpdates)}`);

    try {
      // Get the student database ID
      let studentDbId: number | null = null;
      
      // First try to find by documentId
      const student: any = await strapi.db.query('api::student.student').findOne({
        where: { documentId: id }
      });
      
      if (student) {
        studentDbId = (student as any).id;
        strapi.log.info(`[Student Update] Found student with documentId, db id: ${studentDbId}`);
      } else {
        // Try by numeric id
        const numId = parseInt(id, 10);
        if (!isNaN(numId)) {
          const studentById: any = await strapi.db.query('api::student.student').findOne({
            where: { id: numId }
          });
          if (studentById) {
            studentDbId = (studentById as any).id;
            strapi.log.info(`[Student Update] Found student with numeric id, db id: ${studentDbId}`);
          }
        }
      }

      if (!studentDbId) {
        strapi.log.warn(`[Student Update] Student not found with id: ${id}`);
        return ctx.notFound('Student not found');
      }

      // Update student data using db.query for reliability
      if (Object.keys(dataFields).length > 0) {
        strapi.log.info(`[Student Update] Updating data fields: ${JSON.stringify(dataFields)}`);
        
        const updateResult = await strapi.db.query('api::student.student').update({
          where: { id: studentDbId },
          data: dataFields
        });
        
        strapi.log.info(`[Student Update] Data update result: ${JSON.stringify(updateResult)}`);
      }

      // Handle media updates using entityService (proper Strapi v5 way)
      if (Object.keys(mediaUpdates).length > 0) {
        strapi.log.info(`[Student Update] Updating media fields via entityService: ${JSON.stringify(mediaUpdates)}`);
        
        // Use entityService to update media fields - this handles the morph relation correctly
        await strapi.entityService.update('api::student.student', studentDbId, {
          data: mediaUpdates
        });
        
        strapi.log.info(`[Student Update] Media fields updated successfully`);
      }

      // Fetch and return the complete updated student
      const updatedStudent: any = await strapi.db.query('api::student.student').findOne({
        where: { documentId: id },
        populate: ['course', 'batch', 'user', 'profileImage', 'idCardFront', 'idCardBack', 'certificate', 'branch']
      });

      strapi.log.info(`[Student Update] Final result: ${JSON.stringify(updatedStudent)}`);

      return ctx.send({ data: updatedStudent });

    } catch (err: any) {
      strapi.log.error(`[Student Update] Failed: ${err.message}`);
      return ctx.internalServerError(`Failed to update student: ${err.message}`);
    }
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
      const branchId = fullUser.branch?.id;
      const student: any = await strapi.entityService.findOne('api::student.student', id, {
        populate: ['branch']
      });

      if (!student) return ctx.notFound();

      if (student.branch?.id !== branchId) {
        return ctx.forbidden('You can only delete students in your own branch.');
      }

      return await super.delete(ctx);
    }

    const hasPermission = await checkUserPermission(strapi, user.id, 'api::student.student', 'delete');

    if (hasPermission) {
      return await super.delete(ctx);
    }

    return ctx.forbidden('You do not have permission to delete students.');
  },

  async createPortalAccess(ctx) {
    const { id } = ctx.params;
    const user = ctx.state.user;

    if (!user) return ctx.unauthorized();

    const fullUser = await getUserWithBranch(user.id);
    if (!fullUser) return ctx.unauthorized();

    const roleType = fullUser.roleType;
    const hasAccessToAll = await canAccessAllBranches(user.id);

    if (roleType !== 'institute_admin' && roleType !== 'branch_admin') {
      return ctx.forbidden('Only admins can create portal access.');
    }

    // Find student using entityService — try by documentId first, then numeric id
    let students: any = await strapi.entityService.findMany('api::student.student', {
      filters: { documentId: id } as any,
      populate: ['user', 'branch'],
    });

    if (!students || students.length === 0) {
      const numId = parseInt(id, 10);
      if (!isNaN(numId)) {
        const s: any = await strapi.entityService.findOne('api::student.student', numId, {
          populate: ['user', 'branch'],
        });
        if (s) students = [s];
      }
    }

    if (!students || students.length === 0) {
      return ctx.notFound('Student not found');
    }

    const student = students[0];

    if (roleType === 'branch_admin' && !hasAccessToAll) {
      if (student.branch?.id !== fullUser.branch?.id) {
        return ctx.forbidden('You can only create portal access for students in your branch.');
      }
    }

    try {
      if (student.user) {
        return ctx.badRequest('Student already has portal access');
      }

      if (!student.uid) {
        return ctx.badRequest('Student UID is required to create portal access.');
      }

      const tempPassword = Math.random().toString(36).slice(-8);
      const username = student.uid;
      const email = student.email || `${username}@ansdb.org`;

      const roles = await strapi.entityService.findMany('plugin::users-permissions.role', {
        filters: { type: 'authenticated' }
      });
      const defaultRoleId = roles.length > 0 ? roles[0].id : null;

      const newUser = await strapi.plugins['users-permissions'].services.user.add({
        username,
        email,
        password: tempPassword,
        provider: 'local',
        confirmed: true,
        blocked: false,
        role: defaultRoleId,
        roleType: 'student',
        isActive: true
      });

      // Update student with user reference
      await strapi.db.query('api::student.student').update({
        where: { id: student.id },
        data: {
          user: newUser.id,
          portalAccessStatus: 'active',
        }
      });

      return ctx.send({
        username: newUser.username,
        password: tempPassword
      });

    } catch (err) {
      strapi.log.error(err);
      return ctx.internalServerError('Failed to generate portal access');
    }
  },

  async updatePortalAccessStatus(ctx) {
    strapi.log.info('[updatePortalAccessStatus] Handler reached!');
    const { id } = ctx.params;
    const user = ctx.state.user;

    strapi.log.info(`[updatePortalAccessStatus] User ID: ${user?.id}`);

    if (!user) return ctx.unauthorized();

    const fullUser = await getUserWithBranch(user.id);
    if (!fullUser) return ctx.unauthorized();

    const roleType = fullUser.roleType;
    const hasAccessToAll = await canAccessAllBranches(user.id);
    strapi.log.info(`[updatePortalAccessStatus] Role Type: ${roleType}`);

    if (roleType !== 'institute_admin' && roleType !== 'branch_admin') {
      strapi.log.warn(`[updatePortalAccessStatus] Forbidden: Role type is ${roleType}`);
      return ctx.forbidden('Only admins can manage portal access.');
    }

    const { status } = ctx.request.body;
    const allowedStatuses = ['active', 'hold', 'stopped'];

    if (!allowedStatuses.includes(status)) {
      return ctx.badRequest('Invalid portal access status.');
    }

    // Find student using entityService — try by documentId first, then numeric id
    let students: any = await strapi.entityService.findMany('api::student.student', {
      filters: { documentId: id } as any,
      populate: ['branch', 'user'],
    });

    // If not found by documentId, try numeric id
    if (!students || students.length === 0) {
      const numId = parseInt(id, 10);
      if (!isNaN(numId)) {
        const student: any = await strapi.entityService.findOne('api::student.student', numId, {
          populate: ['branch', 'user'],
        });
        if (student) students = [student];
      }
    }

    if (!students || students.length === 0) {
      return ctx.notFound('Student not found');
    }

    const student = students[0];

    if (roleType === 'branch_admin' && !hasAccessToAll && student.branch?.id !== fullUser.branch?.id) {
      return ctx.forbidden('You can only manage portal access for students in your branch.');
    }

    if (!student.user?.id) {
      return ctx.badRequest('Portal access has not been created for this student yet.');
    }

    const shouldEnableLogin = status === 'active';

    // Update user blocked/active status
    await strapi.entityService.update('plugin::users-permissions.user', student.user.id, {
      data: {
        blocked: !shouldEnableLogin,
        isActive: shouldEnableLogin,
      }
    } as any);

    // Update student portal status using db.query (portalAccessStatus may be a non-schema field)
    await strapi.db.query('api::student.student').update({
      where: { id: student.id },
      data: { portalAccessStatus: status }
    });

    // Return updated student
    return ctx.send({ data: { ...student, portalAccessStatus: status } });
  },
}));

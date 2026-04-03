import { factories } from '@strapi/strapi';
import { canAccessAllBranches, getUserWithBranch } from '../../../utils/branch-access';

export default factories.createCoreController('api::exam-approval.exam-approval' as any, ({ strapi }) => ({
  async find(ctx) {
    return await super.find(ctx);
  },

  async findOne(ctx) {
    return await super.findOne(ctx);
  },

  async create(ctx) {
    const { user } = ctx.state;
    let { data } = ctx.request.body;

    if (data?.student && typeof data.student === 'string') {
      const studentRecord = await strapi.db.query('api::student.student').findOne({
        where: { documentId: data.student }
      });
      
      if (studentRecord) {
        data.student = studentRecord.id;
        strapi.log.debug(`[create exam-approval] Converted student documentId to id ${studentRecord.id}`);
      } else {
        strapi.log.warn(`[create exam-approval] Student not found by documentId: ${data.student}`);
      }
    }

    if (data?.batch && typeof data.batch === 'string') {
      const batchRecord = await strapi.db.query('api::batch.batch').findOne({
        where: { documentId: data.batch }
      });
      
      if (batchRecord) {
        data.batch = batchRecord.id;
        strapi.log.debug(`[create exam-approval] Converted batch documentId to id ${batchRecord.id}`);
      }
    }

    if (data?.exam && typeof data.exam === 'string') {
      const examRecord = await strapi.db.query('api::exam.exam').findOne({
        where: { documentId: data.exam }
      });
      
      if (examRecord) {
        data.exam = examRecord.id;
        strapi.log.debug(`[create exam-approval] Converted exam documentId to id ${examRecord.id}`);
      } else {
        strapi.log.warn(`[create exam-approval] Exam not found by documentId: ${data.exam}`);
      }
    }

    if (data?.course && typeof data.course === 'string') {
      const courseRecord = await strapi.db.query('api::course.course').findOne({
        where: { documentId: data.course }
      });
      
      if (courseRecord) {
        data.course = courseRecord.id;
        strapi.log.debug(`[create exam-approval] Converted course documentId to id ${courseRecord.id}`);
      }
    }

    if (!data.student || !data.exam) {
      return ctx.badRequest('Student and Exam are required for approval');
    }

    // Check for duplicate request
    const existing = await strapi.db.query('api::exam-approval.exam-approval').findOne({
      where: {
        student: data.student,
        exam: data.exam
      }
    });

    if (existing) {
      return ctx.badRequest('You have already submitted an approval request for this exam.');
    }

    ctx.request.body = { data };
    return await super.create(ctx);
  },

  async update(ctx) {
    return await super.update(ctx);
  },

  async delete(ctx) {
    return await super.delete(ctx);
  },

  async getPendingApprovals(ctx) {
    const { user } = ctx.state;
    
    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    const fullUser = await getUserWithBranch(user.id);
    if (!fullUser) return ctx.unauthorized('User not found');

    const roleType = fullUser.roleType;
    const hasAccessToAll = await canAccessAllBranches(user.id);

    const populate = ['student', 'student.course', 'student.batch', 'exam', 'exam.course', 'approvedBy'];
    
    let whereClause: any = { status: 'pending' };

    if (hasAccessToAll) {
      // No filter - see all
    } else if (roleType === 'branch_admin' || roleType === 'teacher') {
      whereClause = {
        status: 'pending',
        student: {
          branch: {
            id: fullUser.branch?.id
          }
        }
      };
    } else {
      return ctx.forbidden('Access denied');
    }

    strapi.log.debug(`[getPendingApprovals] User ${user.id} (${roleType}) fetching pending approvals. Branch: ${fullUser.branch?.id || 'GLOBAL'}`);
    strapi.log.info(`[getPendingApprovals] Filter: ${JSON.stringify(whereClause)}`);

    const entries = await strapi.db.query('api::exam-approval.exam-approval').findMany({
      where: whereClause,
      populate
    });

    strapi.log.info(`[getPendingApprovals] Success: Found ${entries.length} records.`);

    ctx.body = { data: entries, meta: {} };
  },

  async getStudentRequests(ctx) {
    const { user } = ctx.state;
    
    strapi.log.info(`[getStudentRequests] Called - user: ${user?.id || 'NO USER'}, url: ${ctx.url}`);
    
    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    const fullUser = await getUserWithBranch(user.id);
    if (!fullUser) return ctx.unauthorized('User not found');

    const roleType = fullUser.roleType;
    const hasAccessToAll = await canAccessAllBranches(user.id);
    strapi.log.info(`[getStudentRequests] User authenticated - roleType: ${roleType}`);

    const populate = ['student', 'student.course', 'student.batch', 'exam', 'exam.course', 'approvedBy'];

    let entries = [];

    if (roleType === 'student') {
      const studentRecord = await strapi.db.query('api::student.student').findMany({
        where: {
          user: user.id
        }
      });
      
      if (studentRecord.length > 0) {
        const studentId = studentRecord[0].id;
        strapi.log.debug(`[getStudentRequests] Found student record for user ${user.id}: studentId=${studentId}`);
        
        entries = await strapi.db.query('api::exam-approval.exam-approval').findMany({
          where: { student: studentId },
          populate
        });
      } else {
        strapi.log.warn(`[getStudentRequests] No student record found for user ${user.id}`);
      }
    } else if (hasAccessToAll) {
      entries = await strapi.db.query('api::exam-approval.exam-approval').findMany({
        populate
      });
    } else if (roleType === 'branch_admin' || roleType === 'teacher') {
      const branchId = fullUser.branch?.id;
      if (branchId) {
        entries = await strapi.db.query('api::exam-approval.exam-approval').findMany({
          where: {
            student: {
              branch: {
                id: branchId
              }
            }
          },
          populate
        });
      }
    } else {
      return ctx.forbidden('Access denied');
    }

    ctx.body = { data: entries, meta: {} };
  }
}));

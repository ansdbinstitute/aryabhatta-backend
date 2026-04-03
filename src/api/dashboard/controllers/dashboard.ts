export default {
  async getStats(ctx) {
    const { user } = ctx.state;
    // Default values
    let stats: Record<string, any> = {
      totalStudents: 0,
      activeBatches: 0,
      revenueThisMonth: 0,
      pendingFees: 0,
      todayClasses: 0,
      attendanceRate: 0,
      feesPaid: 0,
      dueAmount: 0,
      totalFees: 0,
    };

    try {
      if (user?.role?.type === 'Student') {
        const student = await strapi.db.query('api::student.student').findOne({
          where: { user: user.id },
          populate: ['course', 'batch']
        });

        if (student) {
          // Attendance calculating
          const attendances = await strapi.entityService.findMany('api::attendance.attendance', {
            filters: { student: student.id }
          });
          const present = attendances.filter(a => a.status === 'present').length;
          const attRate = attendances.length > 0 ? (present / attendances.length) * 100 : 0;
          
          stats.attendanceRate = attRate.toFixed(1);
          stats.totalFees = student.course?.totalFees || 0;
          
          // payments
          const payments = await strapi.entityService.findMany('api::payment.payment', {
            filters: { student: student.id, status: 'completed' }
          });
          
          const feesPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
          stats.feesPaid = feesPaid;
          stats.dueAmount = Math.max(0, stats.totalFees - feesPaid);
        }

        return ctx.send(stats);

      } else if (user?.role?.type === 'Teacher') {
        const teacherBatches: any[] = await strapi.entityService.findMany('api::batch.batch', {
          filters: { teacher: user.id },
          populate: ['students']
        }) as any[];
        
        stats.activeBatches = teacherBatches.length;
        
        // Count total students in those batches
        let totalSt = 0;
        teacherBatches.forEach(b => {
          totalSt += (b.students ? b.students.length : 0);
        });
        stats.totalStudents = totalSt;
        
        // For 'Today\'s Classes', count batches where today is between start and end date
        const today = new Date();
        const activeToday = teacherBatches.filter(b => {
          const sd = new Date(b.startDate);
          const ed = new Date(b.endDate);
          return today >= sd && today <= ed;
        });
        
        stats.todayClasses = activeToday.length;
        
        return ctx.send(stats);

      } else {
        // Admin / SuperAdmin
        stats.totalStudents = await strapi.entityService.count('api::student.student');
        stats.activeBatches = await strapi.entityService.count('api::batch.batch', {
          filters: { status: 'ongoing' }
        });
        
        // Mock revenue/pending for now until better queried
        const payments = await strapi.entityService.findMany('api::payment.payment', {
          filters: { status: 'completed' }
        });
        stats.revenueThisMonth = payments.reduce((sum, p) => sum + Number(p.amount), 0);
        
        // A simple query to get all attendance today
        const todayStr = new Date().toISOString().split('T')[0];
        const attendancesToday = await strapi.entityService.findMany('api::attendance.attendance', {
          filters: { date: todayStr }
        });
        const presentToday = attendancesToday.filter(a => a.status === 'present').length;
        stats.attendanceRate = attendancesToday.length > 0 ? ((presentToday / attendancesToday.length) * 100).toFixed(1) : 0;

        return ctx.send(stats);
      }
    } catch (err) {
      strapi.log.error('Dashboard Stats Error', err);
      return ctx.internalServerError('Failed to fetch dashboard stats');
    }
  }
};

export default {
  async beforeCreate(event) {
    const { data } = event.params;

    if (!data.uid) {
      try {
        // 1. Fetch Institute Settings
        const settingsRaw = await strapi.entityService.findMany('api::institute-setting.institute-setting');
        const settings = Array.isArray(settingsRaw) ? settingsRaw[0] : settingsRaw;
        
        const instCode = settings?.instituteCode || 'ANSDB';
        const rawYear = settings?.currentAcademicYear || '2026';
        const year = rawYear.split('-')[0];
        
        // 2. Fetch Course Code
        let courseCode = 'GEN';
        strapi.log.info(`[UID Gen] Incoming course data: ${JSON.stringify(data.course)}`);

        if (data.course) {
          let courseId = null;
          
          // Handle various formats: object with documentId, object with id, { set: [...] }, etc.
          if (typeof data.course === 'object' && data.course !== null) {
            // Handle { set: [{ id: 2 }] } format - Strapi's internal format
            if (data.course.set && Array.isArray(data.course.set) && data.course.set.length > 0) {
              courseId = data.course.set[0].id || data.course.set[0].documentId;
            }
            // Handle { connect: [ { documentId: '...' } ] } format
            else if (data.course.connect && Array.isArray(data.course.connect) && data.course.connect.length > 0) {
              courseId = data.course.connect[0].documentId || data.course.connect[0].id;
            }
            // Handle { documentId: '...' } or { id: ... } format
            else {
              courseId = data.course.documentId || data.course.id;
            }
          } else {
            // It's already a direct value (integer id or string documentId)
            courseId = data.course;
          }

          strapi.log.info(`[UID Gen] Extracted course identifier: ${courseId} (type: ${typeof courseId})`);

          if (courseId) {
            let courseData = null;
            
            // Determine if it's a numeric id or string documentId
            const isNumericId = !isNaN(Number(courseId));
            
            try {
              // Use strapi.db.query for direct database access - most reliable method
              courseData = await strapi.db.query('api::course.course').findOne({
                where: isNumericId ? { id: Number(courseId) } : { documentId: courseId }
              });
            } catch (err) {
              strapi.log.warn(`[UID Gen] Course db lookup failed: ${err.message}`);
            }
            
            if (courseData?.code) {
              courseCode = courseData.code.toUpperCase();
              strapi.log.info(`[UID Gen] Match found! Course Code: ${courseCode}`);
            } else {
              strapi.log.warn(`[UID Gen] Lookup failed for: ${courseId}. Course data: ${JSON.stringify(courseData)}`);
            }
          }
        }

        // 3. Generate Sequence (Perfect Gap-Filler Logic)
        let seq = 1;
        let finalUid = '';
        
        while (true) {
          const seqNumber = seq.toString().padStart(4, '0');
          const candidateUid = `${instCode}${year}-${courseCode}${seqNumber}`;
          
          const existing = await strapi.db.query('api::student.student').findOne({
            where: { uid: candidateUid }
          });
          
          if (!existing) {
            finalUid = candidateUid;
            break;
          }
          seq++;
        }

        // 4. Set final UID: {INST}{YEAR}-{COURSE}{SEQ}
        data.uid = finalUid;
        strapi.log.info(`[UID Gen] New Student UID (Gap-Filled): ${data.uid}`);

      } catch (err) {
        strapi.log.error(`[UID Gen] Failed: ${err.message}`);
        data.uid = `STU-${Date.now()}`;
      }
    }
  },

  async beforeDelete(event) {
    const { params } = event.params;
    const { where } = params;

    try {
      // Fetch student with user relation
      const student = await strapi.db.query('api::student.student').findOne({
        where,
        populate: ['user']
      });

      if (student?.user?.id) {
        // Delete associated user account
        await strapi.db.query('plugin::users-permissions.user').delete({
          where: { id: student.user.id }
        });
        strapi.log.info(`[Cleanup] Deleted user account: ${student.user.id} for student ${student.uid}`);
      }
    } catch (err) {
      // Don't let cleanup failures block student deletion
      strapi.log.warn(`[Cleanup] Non-blocking failure: ${err.message}`);
    }
  }
};

export default {
  routes: [
    {
      method: 'GET',
      path: '/exam-approvals/pending',
      handler: 'api::exam-approval.exam-approval.getPendingApprovals',
      config: {
        auth: { enabled: true },
      },
    },
    {
      method: 'GET',
      path: '/exam-approvals/student-requests',
      handler: 'api::exam-approval.exam-approval.getStudentRequests',
      config: {
        auth: { enabled: true },
      },
    },
  ],
};

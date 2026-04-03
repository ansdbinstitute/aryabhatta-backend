export default {
  find: async (params: any) => {
    return strapi.entityService.findMany('api::exam-approval.exam-approval' as any, params);
  },
  findOne: async (id: number, params: any) => {
    return strapi.entityService.findOne('api::exam-approval.exam-approval' as any, id, params);
  },
  create: async (params: any) => {
    return strapi.entityService.create('api::exam-approval.exam-approval' as any, params);
  },
  update: async (id: number, params: any) => {
    return strapi.entityService.update('api::exam-approval.exam-approval' as any, id, params);
  },
  delete: async (id: number, params: any) => {
    return strapi.entityService.delete('api::exam-approval.exam-approval' as any, id, params);
  },
};

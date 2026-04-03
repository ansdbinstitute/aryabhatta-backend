export default {
  find: async (params) => {
    const uid = 'api::role-access-matrix.role-access-matrix' as any;
    return strapi.entityService.findMany(uid, params);
  },
  findOne: async (id, params) => {
    const uid = 'api::role-access-matrix.role-access-matrix' as any;
    return strapi.entityService.findOne(uid, id, params);
  },
  create: async (params) => {
    const uid = 'api::role-access-matrix.role-access-matrix' as any;
    return strapi.entityService.create(uid, params);
  },
  update: async (id, params) => {
    const uid = 'api::role-access-matrix.role-access-matrix' as any;
    return strapi.entityService.update(uid, id, params);
  },
};

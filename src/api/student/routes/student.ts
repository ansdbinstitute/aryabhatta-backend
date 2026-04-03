import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::student.student', {
  config: {
    find: {
      middlewares: ['api::student.auth-filter'],
    },
    findOne: {
      middlewares: ['api::student.auth-filter'],
    },
    create: {
      middlewares: ['api::student.auth-filter'],
    },
    update: {
      middlewares: ['api::student.auth-filter'],
    },
    delete: {
      middlewares: ['api::student.auth-filter'],
    },
  },
});

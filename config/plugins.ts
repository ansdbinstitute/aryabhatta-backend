import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Plugin => ({
  cloud: {
    enabled: false,
  },
  upload: {
    config: {
      sizeLimit: 10 * 1024 * 1024,
    },
  },
});

export default config;

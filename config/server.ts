import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Server => ({
  host: '0.0.0.0',   // ✅ important
  port: 1337,
  url: '',           // ✅ no forced domain
  app: {
    keys: env.array('APP_KEYS'),
  },
});

export default config;

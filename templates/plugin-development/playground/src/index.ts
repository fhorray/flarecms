import { Hono } from 'hono';
import { createFlareCMS } from 'flarecms';
import myPlugin from '{{PLUGIN_PACKAGE_NAME}}';

const app = new Hono();

// Initialize FlareCMS with the local starter plugin
const flare = createFlareCMS({
  plugins: [
    myPlugin
  ],
  encryptionSecret: 'starter-secret-key-change-me'
});

// Mount FlareCMS API and Admin
app.route('/', flare.handler);

export default app;

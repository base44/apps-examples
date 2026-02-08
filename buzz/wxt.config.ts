import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Buzz',
    description: 'Your AI-powered browser sidekick. Chat, organize tabs, and browse smarter.',
    permissions: [
      'tabs',
      'tabGroups',
      'storage',
      'activeTab',
      'sidePanel',
      'bookmarks',
      'scripting',
      'contextMenus'
    ],
    host_permissions: ['<all_urls>'],
    action: {
      default_title: 'Open Buzz'
    }
  },
});

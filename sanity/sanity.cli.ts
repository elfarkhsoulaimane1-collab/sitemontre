import { defineCliConfig } from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: '1u8lkn99',
    dataset:   'production',
  },
  autoUpdates: true,
})

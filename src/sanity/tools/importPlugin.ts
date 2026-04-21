import { definePlugin } from 'sanity'
import { DownloadIcon } from '@sanity/icons'
import { ImportTool } from './ImportTool'

export const importPlugin = definePlugin({
  name: 'import-url-tool',
  tools: [
    {
      name:      'import-url',
      title:     'Importer URL',
      icon:      DownloadIcon,
      component: ImportTool,
    },
  ],
})

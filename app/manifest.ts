import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SaveFor',
    short_name: 'SaveFor',
    description: 'แอปพลิเคชันบันทึกรายรับรายจ่าย และวางแผนการออมเงิน',
    start_url: '/',
    display: 'standalone',
    background_color: '#F0F5F2',
    theme_color: '#10b981',
    icons: [
      {
        src: '/logo.jpg',
        sizes: '192x192 512x512',
        type: 'image/jpeg',
      },
    ],
  }
}

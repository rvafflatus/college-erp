import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Afflatus College ERP',
    short_name: 'Afflatus ERP',
    description: 'Next-Generation College Management System by Afflatus',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#075985', // Matches your Cyan-800 header banner color
    icons: [
      {
        src: 'https://cdn-icons-png.flaticon.com/512/2201/2201558.png', // Temporary high-res school icon
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
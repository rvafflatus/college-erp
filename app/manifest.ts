import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Afflatus College ERP',
    short_name: 'Afflatus ERP',
    description: 'Next-Generation College Management System by Afflatus',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#075985', // Matches your premium Cyan-800 branding
    icons: [
      {
        // Premium HD Education & Smart Student/Coaching Icon Vector
        src: 'https://cdn-icons-png.flaticon.com/512/3413/3413535.png', 
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
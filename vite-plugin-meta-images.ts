import type { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';

/**
 * Vite plugin that updates og:image and twitter:image meta tags
 * to point to the app's opengraph image with the correct Replit domain.
 */
export function metaImagesPlugin(): Plugin {
  return {
    name: 'vite-plugin-meta-images',
    transformIndexHtml(html) {
      const baseUrl = getDeploymentUrl();
      if (!baseUrl) {
        log('[meta-images] no Replit deployment domain found, skipping meta tag updates');
        return html;
      }

      // Check if opengraph image exists in public directory
      const publicDir = path.resolve(process.cwd(), 'client', 'public');
      const candidates = [
        { path: path.join(publicDir, 'opengraph-v2.png'), name: 'opengraph-v2.png' },
        { path: path.join(publicDir, 'opengraph-v2.jpg'), name: 'opengraph-v2.jpg' },
        { path: path.join(publicDir, 'opengraph-v2.jpeg'), name: 'opengraph-v2.jpeg' },
        { path: path.join(publicDir, 'opengraph.png'), name: 'opengraph.png' },
        { path: path.join(publicDir, 'opengraph.jpg'), name: 'opengraph.jpg' },
        { path: path.join(publicDir, 'opengraph.jpeg'), name: 'opengraph.jpeg' },
      ];

      let imageName: string | null = null;
      for (const c of candidates) {
        if (fs.existsSync(c.path)) {
          imageName = c.name;
          break;
        }
      }

      if (!imageName) {
        log('[meta-images] OpenGraph image not found, skipping meta tag updates');
        return html;
      }

      const imageUrl = `${baseUrl}/${imageName}`;

      log('[meta-images] updating meta image tags to:', imageUrl);

      html = html.replace(
        /<meta\s+property="og:image"\s+content="[^"]*"\s*\/>/g,
        `<meta property="og:image" content="${imageUrl}" />`
      );

      html = html.replace(
        /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/>/g,
        `<meta name="twitter:image" content="${imageUrl}" />`
      );

      return html;
    },
  };
}

function getDeploymentUrl(): string | null {
  if (process.env.REPLIT_INTERNAL_APP_DOMAIN) {
    const url = `https://${process.env.REPLIT_INTERNAL_APP_DOMAIN}`;
    log('[meta-images] using internal app domain:', url);
    return url;
  }

  if (process.env.REPLIT_DEV_DOMAIN) {
    const url = `https://${process.env.REPLIT_DEV_DOMAIN}`;
    log('[meta-images] using dev domain:', url);
    return url;
  }

  return null;
}

function log(...args: any[]): void {
  if (process.env.NODE_ENV === 'production') {
    console.log(...args);
  }
}

import sharp from 'sharp';

async function generateAppIcon(size, filename, radiusPercent, maskable = false) {
    const rx = (size * radiusPercent) / 100;
    
    // The margin means we scale the inner SVG.
    // 50% scale for graphic placement with elegant breathing room.
    const innerSize = size * 0.5;
    const padding = (size - innerSize) / 2;

    const baseSvg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${size}" rx="${rx}" ry="${rx}" fill="#27272a" />
        <g transform="translate(${padding}, ${padding}) scale(${innerSize / 100})">
          <path d="M 32 10 C 15 25, 15 75, 32 90" stroke="#ffffff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M 32 10 L 68 10 C 74 10, 78 14, 78 20 L 78 80 C 78 86, 74 90, 68 90 L 32 90" stroke="#ffffff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
          <line x1="32" y1="10" x2="32" y2="90" stroke="#ffffff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
          <line x1="32" y1="45" x2="72" y2="16" stroke="#ffffff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
          <line x1="32" y1="45" x2="78" y2="86" stroke="#ffffff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
        </g>
      </svg>`;

    await sharp(Buffer.from(baseSvg))
        .png()
        .toFile('public/' + filename);
    console.log('Generated ' + filename);
}

async function main() {
    await generateAppIcon(180, 'apple-touch-icon.png', 25);
    await generateAppIcon(192, 'icon-192x192.png', 0, true);
    await generateAppIcon(512, 'icon-512x512.png', 0, true);
}

main().catch(console.error);

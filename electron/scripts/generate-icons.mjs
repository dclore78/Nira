import { promises as fs } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const ICONS_DIR = join(__dirname, '../icons')

// Simple SVG icon with "N" monogram in cyan/blue theme
const SVG_ICON = `
<svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#00d4ff;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0099cc;stop-opacity:1" />
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge> 
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Background circle -->
  <circle cx="128" cy="128" r="120" fill="url(#grad)" filter="url(#glow)"/>
  
  <!-- Letter N -->
  <path d="M 70 80 L 70 176 L 85 176 L 85 110 L 170 176 L 185 176 L 185 80 L 170 80 L 170 150 L 85 80 Z" 
        fill="white" 
        stroke="none"
        filter="url(#glow)"/>
</svg>
`.trim()

async function generateIcons() {
  try {
    await fs.mkdir(ICONS_DIR, { recursive: true })
    
    // Save SVG
    await fs.writeFile(join(ICONS_DIR, 'icon.svg'), SVG_ICON)
    console.log('Generated SVG icon')
    
    // For demo purposes, create a simple PNG placeholder
    // In a real implementation, you'd use a library like sharp to convert SVG to various sizes
    const PNG_PLACEHOLDER = `# Icon placeholder
# In production, convert the SVG to these formats:
# - icon.ico (Windows)
# - icon.png (256x256)
# - icon-16.png (16x16)
# - icon-32.png (32x32)
# - icon-48.png (48x48)
# - icon-128.png (128x128)
# - icon-256.png (256x256)

# Use a tool like Imagemagick or sharp.js to convert:
# convert icon.svg -resize 256x256 icon.png
# convert icon.svg -resize 16x16 icon-16.png
# etc.
`
    
    await fs.writeFile(join(ICONS_DIR, 'GENERATE_ICONS.md'), PNG_PLACEHOLDER)
    console.log('Created icon generation instructions')
    
    // Create minimal ico file (in production, use proper conversion)
    await fs.writeFile(join(ICONS_DIR, 'icon.ico'), Buffer.from([]))
    await fs.writeFile(join(ICONS_DIR, 'icon.png'), Buffer.from([]))
    
    console.log('Icon generation complete (placeholders created)')
  } catch (error) {
    console.error('Icon generation failed:', error)
    process.exit(1)
  }
}

generateIcons()
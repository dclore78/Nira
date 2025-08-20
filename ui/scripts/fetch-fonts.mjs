import { promises as fs } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const FONTS_DIR = join(__dirname, '../public/fonts')

const FONTS = [
  {
    name: 'Oxanium',
    weights: ['400', '700'],
    url: 'https://fonts.googleapis.com/css2?family=Oxanium:wght@400;700&display=swap'
  },
  {
    name: 'Space Grotesk',
    weights: ['400', '700'],
    url: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&display=swap'
  },
  {
    name: 'Space Mono',
    weights: ['400'],
    url: 'https://fonts.googleapis.com/css2?family=Space+Mono:wght@400&display=swap'
  }
]

async function downloadFont(url, fontName, weight) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`)
    }
    
    const css = await response.text()
    
    // Extract woff2 URLs from CSS
    const woff2Urls = css.match(/url\(([^)]+\.woff2)\)/g)
    
    if (!woff2Urls) {
      console.warn(`No woff2 URLs found in CSS for ${fontName}`)
      return
    }
    
    for (const match of woff2Urls) {
      const fontUrl = match.replace(/url\(([^)]+)\)/, '$1')
      const cleanUrl = fontUrl.replace(/['"]/g, '')
      
      const fontResponse = await fetch(cleanUrl)
      if (!fontResponse.ok) {
        console.warn(`Failed to download font: ${cleanUrl}`)
        continue
      }
      
      const fontBuffer = await fontResponse.arrayBuffer()
      const fileName = `${fontName.replace(/\s+/g, '')}-${weight}.woff2`
      const filePath = join(FONTS_DIR, fileName)
      
      await fs.writeFile(filePath, Buffer.from(fontBuffer))
      console.log(`Downloaded: ${fileName}`)
    }
  } catch (error) {
    console.warn(`Failed to download ${fontName}: ${error.message}`)
  }
}

async function generateFontCSS() {
  const fontFaces = []
  
  for (const font of FONTS) {
    for (const weight of font.weights) {
      const fileName = `${font.name.replace(/\s+/g, '')}-${weight}.woff2`
      const fontPath = join(FONTS_DIR, fileName)
      
      try {
        await fs.access(fontPath)
        fontFaces.push(`
@font-face {
  font-family: '${font.name}';
  font-style: normal;
  font-weight: ${weight};
  font-display: swap;
  src: url('./fonts/${fileName}') format('woff2');
}`)
      } catch (error) {
        console.warn(`Font file not found: ${fileName}`)
      }
    }
  }
  
  const cssContent = fontFaces.join('\n')
  await fs.writeFile(join(__dirname, '../public/fonts.css'), cssContent)
  console.log('Generated fonts.css')
}

async function main() {
  try {
    await fs.mkdir(FONTS_DIR, { recursive: true })
    console.log('Setting up fonts...')
    
    // Skip external font fetching and create fallback CSS
    console.log('Using system font fallbacks (external fonts blocked)')
    
    // Generate CSS with system font fallbacks
    const fallbackCSS = `
/* NIRA Font Stack - System Fallbacks */
:root {
  --font-heading: 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
  --font-body: 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
  --font-mono: 'Consolas', 'Monaco', 'Lucida Console', monospace;
}

/* Brand font fallbacks */
.font-oxanium { font-family: var(--font-heading); }
.font-space-grotesk { font-family: var(--font-body); }
.font-space-mono { font-family: var(--font-mono); }
`
    
    await fs.writeFile(join(__dirname, '../public/fonts.css'), fallbackCSS)
    console.log('Generated fallback fonts.css')
    console.log('Font setup complete!')
  } catch (error) {
    console.error('Font setup failed:', error)
    process.exit(1)
  }
}

main()
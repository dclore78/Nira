import { promises as fs } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const UI_DIST = join(__dirname, '../../ui/dist')
const RENDERER_DIR = join(__dirname, '../renderer')

async function copyUI() {
  try {
    // Check if UI dist exists
    await fs.access(UI_DIST)
    
    // Remove existing renderer directory
    try {
      await fs.rm(RENDERER_DIR, { recursive: true, force: true })
    } catch (e) {
      // Directory might not exist
    }
    
    // Create renderer directory
    await fs.mkdir(RENDERER_DIR, { recursive: true })
    
    // Copy UI files
    async function copyRecursive(src, dest) {
      const stat = await fs.stat(src)
      if (stat.isDirectory()) {
        await fs.mkdir(dest, { recursive: true })
        const files = await fs.readdir(src)
        for (const file of files) {
          await copyRecursive(join(src, file), join(dest, file))
        }
      } else {
        await fs.copyFile(src, dest)
      }
    }
    
    const items = await fs.readdir(UI_DIST)
    for (const item of items) {
      await copyRecursive(join(UI_DIST, item), join(RENDERER_DIR, item))
    }
    
    console.log('UI copied to renderer directory successfully')
  } catch (error) {
    console.warn('Failed to copy UI (build UI first):', error.message)
    console.log('Run: cd ui && npm run build')
  }
}

copyUI()
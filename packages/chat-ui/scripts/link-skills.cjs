#!/usr/bin/env node

/**
 * Auto-link Claude Code Skills
 *
 * When users install the aix-chat package, this script links skills
 * to the consumer project's .claude/skills directory so they can use
 * /ai-chat-integration to quickly integrate the chat component.
 *
 * Skipped if:
 * - SKIP_AIX_SKILLS env var is set
 * - No .claude directory exists in the project root (user doesn't use Claude Code)
 */

const fs = require('fs')
const path = require('path')

// Skip if user opts out
if (process.env.SKIP_AIX_SKILLS) {
  console.log('[aix-chat] Skills linking skipped (SKIP_AIX_SKILLS is set)')
  process.exit(0)
}

// Find project root by walking up from this script's location
function findProjectRoot(startDir) {
  let currentDir = startDir

  while (currentDir !== path.dirname(currentDir)) {
    // Check for monorepo root (pnpm, yarn, npm workspaces)
    if (
      fs.existsSync(path.join(currentDir, 'pnpm-workspace.yaml')) ||
      fs.existsSync(path.join(currentDir, 'yarn.lock')) ||
      fs.existsSync(path.join(currentDir, 'package-lock.json'))
    ) {
      // Verify it's actually a monorepo root (has a package.json)
      if (fs.existsSync(path.join(currentDir, 'package.json'))) {
        return currentDir
      }
    }

    const packageJsonPath = path.join(currentDir, 'package.json')
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))

        // Skip aix-chat itself
        if (packageJson.name === 'aix-chat') {
          currentDir = path.dirname(currentDir)
          continue
        }

        return currentDir
      } catch {
        // ignore parse errors
      }
    }

    currentDir = path.dirname(currentDir)
  }

  return null
}

// Create symlink (cross-platform)
function createSymlink(src, dest) {
  try {
    if (fs.existsSync(dest)) {
      const stats = fs.lstatSync(dest)
      if (stats.isSymbolicLink()) {
        fs.unlinkSync(dest)
      } else {
        console.log(`[aix-chat] ⚠️  ${dest} already exists, skipping`)
        return false
      }
    }

    const destDir = path.dirname(dest)
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true })
    }

    // Use 'junction' on Windows, 'dir' on Unix
    const type = process.platform === 'win32' ? 'junction' : 'dir'
    fs.symlinkSync(src, dest, type)
    return true
  } catch (error) {
    console.error(`[aix-chat] ❌ Failed to create link: ${error.message}`)
    return false
  }
}

function main() {
  const packageDir = __dirname
  const skillsSource = path.join(packageDir, '..', '.claude', 'skills')

  if (!fs.existsSync(skillsSource)) {
    return
  }

  const projectRoot = findProjectRoot(packageDir)
  if (!projectRoot) {
    return
  }

  // Only link if the project already uses Claude Code (has .claude dir)
  const claudeDir = path.join(projectRoot, '.claude')
  if (!fs.existsSync(claudeDir)) {
    // User doesn't use Claude Code — skip silently
    return
  }

  const skillsDest = path.join(claudeDir, 'skills')
  if (!fs.existsSync(skillsDest)) {
    fs.mkdirSync(skillsDest, { recursive: true })
  }

  const skills = fs.readdirSync(skillsSource)
  let linkedCount = 0

  for (const skill of skills) {
    const src = path.join(skillsSource, skill)
    const dest = path.join(skillsDest, skill)

    if (fs.statSync(src).isDirectory()) {
      if (createSymlink(src, dest)) {
        console.log(`[aix-chat] ✅ Linked skill: ${skill}`)
        linkedCount++
      }
    }
  }

  if (linkedCount > 0) {
    console.log(`[aix-chat] 🎉 ${linkedCount} skill(s) installed!`)
    console.log(`[aix-chat] 💡 You can now use these skills in Claude Code`)
    console.log(`[aix-chat] ℹ️  Set SKIP_AIX_SKILLS=1 to disable auto-linking`)
  }
}

main()

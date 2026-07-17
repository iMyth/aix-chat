#!/usr/bin/env node

/**
 * 自动链接 Claude Code Skills
 *
 * 当用户安装 aix-chat 包时，自动将 skills 链接到用户项目的 .claude/skills 目录
 * 这样用户就可以使用 /ai-chat-integration 等 skill 来快速集成聊天功能
 */

const fs = require('fs')
const path = require('path')

// 查找项目根目录（向上查找 package.json，直到找到包含 .claude 的目录或到达根目录）
function findProjectRoot(startDir) {
  let currentDir = startDir

  while (currentDir !== path.dirname(currentDir)) {
    // 检查是否是 monorepo 根目录（有 pnpm-workspace.yaml）
    if (fs.existsSync(path.join(currentDir, 'pnpm-workspace.yaml'))) {
      return currentDir
    }

    // 检查是否是独立项目根目录（有 package.json 且有 .claude 或 node_modules）
    const packageJsonPath = path.join(currentDir, 'package.json')
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))

      // 如果是 aix-chat 本身，跳过
      if (packageJson.name === 'aix-chat') {
        currentDir = path.dirname(currentDir)
        continue
      }

      // 如果有 .claude 目录或 node_modules，认为是项目根目录
      if (
        fs.existsSync(path.join(currentDir, '.claude')) ||
        fs.existsSync(path.join(currentDir, 'node_modules'))
      ) {
        return currentDir
      }
    }

    currentDir = path.dirname(currentDir)
  }

  return null
}

// 创建符号链接
function createSymlink(src, dest) {
  try {
    // 如果目标已存在，先删除
    if (fs.existsSync(dest)) {
      const stats = fs.lstatSync(dest)
      if (stats.isSymbolicLink()) {
        fs.unlinkSync(dest)
      } else {
        console.log(`[aix-chat] ⚠️  ${dest} 已存在，跳过链接`)
        return false
      }
    }

    // 创建目标目录
    const destDir = path.dirname(dest)
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true })
    }

    // 创建符号链接
    fs.symlinkSync(src, dest, 'junction')
    return true
  } catch (error) {
    console.error(`[aix-chat] ❌ 创建链接失败: ${error.message}`)
    return false
  }
}

// 主函数
function main() {
  const packageDir = __dirname
  const skillsSource = path.join(packageDir, '..', '.claude', 'skills')

  // 检查 skills 目录是否存在
  if (!fs.existsSync(skillsSource)) {
    console.log('[aix-chat] ℹ️  Skills 目录不存在，跳过链接')
    return
  }

  // 查找项目根目录
  const projectRoot = findProjectRoot(packageDir)

  if (!projectRoot) {
    console.log('[aix-chat] ℹ️  未找到项目根目录，跳过 skills 链接')
    return
  }

  // 创建 .claude/skills 目录
  const skillsDest = path.join(projectRoot, '.claude', 'skills')

  if (!fs.existsSync(skillsDest)) {
    fs.mkdirSync(skillsDest, { recursive: true })
  }

  // 链接每个 skill
  const skills = fs.readdirSync(skillsSource)
  let linkedCount = 0

  for (const skill of skills) {
    const src = path.join(skillsSource, skill)
    const dest = path.join(skillsDest, skill)

    // 只链接目录
    if (fs.statSync(src).isDirectory()) {
      if (createSymlink(src, dest)) {
        console.log(`[aix-chat] ✅ 链接 skill: ${skill}`)
        linkedCount++
      }
    }
  }

  if (linkedCount > 0) {
    console.log(`[aix-chat] 🎉 Skills 安装完成!`)
    console.log(`[aix-chat] 💡 现在可以在 Claude Code 中使用这些 skills 了`)
  } else {
    console.log(`[aix-chat] ℹ️  所有 skills 已存在，无需链接`)
  }
}

main()

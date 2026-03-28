#!/usr/bin/env tsx

/**
 * Security Audit Script
 * Performs comprehensive security checks on the codebase
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import { execSync } from 'child_process'

interface SecurityIssue {
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  file: string
  line?: number
  message: string
  recommendation?: string
}

interface AuditResult {
  category: string
  issues: SecurityIssue[]
  summary: string
}

const results: AuditResult[] = []

/**
 * Check for hardcoded secrets in code
 */
async function checkSecrets(): Promise<AuditResult> {
  const issues: SecurityIssue[] = []
  const secretPatterns = [
    { pattern: /password\s*[:=]\s*['"]([^'"]+)['"]/i, type: 'password' },
    { pattern: /api[_-]?key\s*[:=]\s*['"]([^'"]+)['"]/i, type: 'api-key' },
    { pattern: /secret\s*[:=]\s*['"]([^'"]+)['"]/i, type: 'secret' },
    { pattern: /token\s*[:=]\s*['"]([^'"]{20,})['"]/i, type: 'token' },
    { pattern: /sk-[a-zA-Z0-9]{20,}/, type: 'openai-key' },
    { pattern: /ghp_[a-zA-Z0-9]{36}/, type: 'github-token' },
    { pattern: /AKIA[0-9A-Z]{16}/, type: 'aws-access-key' },
  ]

  const searchDirs = [
    'packages/format/src',
    'packages/importer',
    'packages/cli/src',
    'packages/viewer-web/src',
  ]

  for (const dir of searchDirs) {
    try {
      const files = await getAllFiles(dir)
      for (const file of files) {
        if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
          const content = await fs.readFile(file, 'utf-8')
          const lines = content.split('\n')

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i]
            for (const { pattern, type } of secretPatterns) {
              if (pattern.test(line) && !line.trim().startsWith('//')) {
                issues.push({
                  type: 'hardcoded-secret',
                  severity: 'high',
                  file: file.replace(process.cwd(), ''),
                  line: i + 1,
                  message: `Potential ${type} found in code`,
                  recommendation: 'Move to environment variable or secure credential store',
                })
              }
            }
          }
        }
      }
    } catch (error) {
      // Directory doesn't exist or permission error
    }
  }

  return {
    category: 'Hardcoded Secrets',
    issues,
    summary: issues.length === 0
      ? 'No hardcoded secrets detected'
      : `Found ${issues.length} potential hardcoded secret(s)`,
  }
}

/**
 * Check for insecure dependencies
 */
async function checkDependencies(): Promise<AuditResult> {
  const issues: SecurityIssue[] = []

  try {
    // Run npm audit
    const auditOutput = execSync('pnpm audit --json', {
      encoding: 'utf-8',
      stdio: 'pipe',
    })

    const audit = JSON.parse(auditOutput)

    if (audit.vulnerabilities) {
      for (const [name, vuln] of Object.entries(audit.vulnerabilities as any)) {
        const severity = vuln.severity || 'unknown'
        issues.push({
          type: 'vulnerable-dependency',
          severity:
            severity === 'critical'
              ? 'critical'
              : severity === 'high'
              ? 'high'
              : severity === 'medium'
              ? 'medium'
              : 'low',
          file: `package.json (${name})`,
          message: `${name} has known vulnerabilities`,
          recommendation: `Run: pnpm update ${name}`,
        })
      }
    }
  } catch (error: any) {
    // npm audit returns non-zero exit code if vulnerabilities found
    if (error.stdout) {
      try {
        const audit = JSON.parse(error.stdout)
        if (audit.vulnerabilities) {
          for (const [name, vuln] of Object.entries(audit.vulnerabilities)) {
            issues.push({
              type: 'vulnerable-dependency',
              severity: vuln.severity || 'medium',
              file: `package.json (${name})`,
              message: `${name} has known vulnerabilities`,
              recommendation: `Run: pnpm update ${name}`,
            })
          }
        }
      } catch {
        // Ignore parse errors
      }
    }
  }

  return {
    category: 'Dependency Security',
    issues,
    summary: issues.length === 0
      ? 'No vulnerable dependencies found'
      : `Found ${issues.length} vulnerable dependenc(ies)`,
  }
}

/**
 * Check for dangerous code patterns
 */
async function checkDangerousPatterns(): Promise<AuditResult> {
  const issues: SecurityIssue[] = []
  const dangerousPatterns = [
    {
      pattern: /eval\s*\(/,
      type: 'eval-usage',
      message: 'Use of eval() function',
      severity: 'high',
      recommendation: 'Avoid eval() - use safer alternatives',
    },
    {
      pattern: /innerHTML\s*=/,
      type: 'innerhtml',
      message: 'Direct innerHTML assignment can lead to XSS',
      severity: 'high',
      recommendation: 'Use textContent or sanitize HTML first',
    },
    {
      pattern: /dangerouslySetInnerHTML/,
      type: 'dangerous-html',
      message: 'Use of dangerouslySetInnerHTML',
      severity: 'medium',
      recommendation: 'Ensure content is sanitized or use DOMPurify',
    },
    {
      pattern: /exec\s*\(|spawn\s*\(|fork\s*\(/,
      type: 'command-execution',
      message: 'Arbitrary command execution',
      severity: 'high',
      recommendation: 'Validate and sanitize all input',
    },
    {
      pattern: /Math\.random\s*\(\)/,
      type: 'weak-random',
      message: 'Weak random number generation',
      severity: 'low',
      recommendation: 'Use crypto.randomBytes() for security-critical code',
    },
  ]

  const searchDirs = [
    'packages/format/src',
    'packages/importer',
    'packages/cli/src',
    'packages/viewer-web/src',
  ]

  for (const dir of searchDirs) {
    try {
      const files = await getAllFiles(dir)
      for (const file of files) {
        if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
          const content = await fs.readFile(file, 'utf-8')
          const lines = content.split('\n')

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i]
            for (const pattern of dangerousPatterns) {
              if (pattern.pattern.test(line) && !line.trim().startsWith('//')) {
                issues.push({
                  type: pattern.type,
                  severity: pattern.severity as any,
                  file: file.replace(process.cwd(), ''),
                  line: i + 1,
                  message: pattern.message,
                  recommendation: pattern.recommendation,
                })
              }
            }
          }
        }
      }
    } catch (error) {
      // Directory doesn't exist
    }
  }

  return {
    category: 'Dangerous Code Patterns',
    issues,
    summary: issues.length === 0
      ? 'No dangerous patterns detected'
      : `Found ${issues.length} dangerous pattern(s)`,
  }
}

/**
 * Check for exposed sensitive files
 */
async function checkExposedFiles(): Promise<AuditResult> {
  const issues: SecurityIssue[] = []

  const sensitiveFiles = [
    '.env',
    '.env.local',
    '.env.production',
    '.env.*.local',
    '*.pem',
    '*.key',
    'id_rsa',
    'id_rsa.pub',
    '.npmrc',
    '.aws/credentials',
  ]

  // Check if these files are tracked in git
  try {
    for (const pattern of sensitiveFiles) {
      try {
        const output = execSync(`git ls-files ${pattern}`, {
          encoding: 'utf-8',
          stdio: 'pipe',
        })

        if (output.trim()) {
          issues.push({
            type: 'exposed-sensitive-file',
            severity: 'critical',
            file: pattern,
            message: `Sensitive file tracked in git: ${pattern}`,
            recommendation: 'Remove from git history and add to .gitignore',
          })
        }
      } catch {
        // No files found
      }
    }
  } catch {
    // Not in git repo
  }

  // Check .gitignore
  try {
    const gitignore = await fs.readFile('.gitignore', 'utf-8')
    const requiredIgnores = ['.env', '*.key', '*.pem', 'id_rsa']

    for (const required of requiredIgnores) {
      if (!gitignore.includes(required)) {
        issues.push({
          type: 'missing-gitignore-entry',
          severity: 'medium',
          file: '.gitignore',
          message: `Missing entry in .gitignore: ${required}`,
          recommendation: `Add "${required}" to .gitignore`,
        })
      }
    }
  } catch {
    issues.push({
      type: 'missing-gitignore',
      severity: 'high',
      file: '.gitignore',
      message: 'No .gitignore file found',
      recommendation: 'Create .gitignore with common exclusions',
    })
  }

  return {
    category: 'Exposed Files',
    issues,
    summary: issues.length === 0
      ? 'No exposed sensitive files detected'
      : `Found ${issues.length} exposed file issue(s)`,
  }
}

/**
 * Check for proper input validation
 */
async function checkInputValidation(): Promise<AuditResult> {
  const issues: SecurityIssue[] = []

  // Look for file operations without validation
  const searchDirs = ['packages/format/src', 'packages/cli/src']

  for (const dir of searchDirs) {
    try {
      const files = await getAllFiles(dir)
      for (const file of files) {
        if (file.endsWith('.ts')) {
          const content = await fs.readFile(file, 'utf-8')
          const lines = content.split('\n')

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i]

            // Check for readFile without validation
            if (/readFile\s*\(/.test(line) && !line.includes('validate')) {
              issues.push({
                type: 'unvalidated-file-read',
                severity: 'medium',
                file: file.replace(process.cwd(), ''),
                line: i + 1,
                message: 'File read without path validation',
                recommendation: 'Validate and sanitize file paths before reading',
              })
            }

            // Check for writeFile without validation
            if (/writeFile\s*\(/.test(line) && !line.includes('validate')) {
              issues.push({
                type: 'unvalidated-file-write',
                severity: 'high',
                file: file.replace(process.cwd(), ''),
                line: i + 1,
                message: 'File write without path validation',
                recommendation: 'Validate and sanitize file paths before writing',
              })
            }
          }
        }
      }
    } catch {
      // Directory doesn't exist
    }
  }

  return {
    category: 'Input Validation',
    issues,
    summary: issues.length === 0
      ? 'Input validation looks good'
      : `Found ${issues.length} potential validation issue(s)`,
  }
}

/**
 * Helper function to get all files recursively
 */
async function getAllFiles(dirPath: string): Promise<string[]> {
  const files: string[] = []

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name)

      if (entry.isDirectory()) {
        const subFiles = await getAllFiles(fullPath)
        files.push(...subFiles)
      } else {
        files.push(fullPath)
      }
    }
  } catch {
    // Directory doesn't exist or permission error
  }

  return files
}

/**
 * Main audit function
 */
async function runAudit() {
  console.log('🔒 Running Security Audit...\n')

  console.log('📋 Checking for hardcoded secrets...')
  results.push(await checkSecrets())

  console.log('📦 Checking dependencies for vulnerabilities...')
  results.push(await checkDependencies())

  console.log('⚠️  Checking for dangerous code patterns...')
  results.push(await checkDangerousPatterns())

  console.log('📁 Checking for exposed sensitive files...')
  results.push(await checkExposedFiles())

  console.log('✅ Checking input validation...')
  results.push(await checkInputValidation())

  console.log('\n' + '='.repeat(60))
  console.log('SECURITY AUDIT REPORT')
  console.log('='.repeat(60) + '\n')

  let totalIssues = 0
  let criticalCount = 0
  let highCount = 0
  let mediumCount = 0
  let lowCount = 0

  for (const result of results) {
    console.log(`\n📊 ${result.category}`)
    console.log(`   ${result.summary}`)

    if (result.issues.length > 0) {
      console.log(`   Issues found: ${result.issues.length}\n`)

      for (const issue of result.issues) {
        totalIssues++

        switch (issue.severity) {
          case 'critical':
            criticalCount++
            break
          case 'high':
            highCount++
            break
          case 'medium':
            mediumCount++
            break
          case 'low':
            lowCount++
            break
        }

        const severityIcon =
          issue.severity === 'critical'
            ? '🔴'
            : issue.severity === 'high'
            ? '🟠'
            : issue.severity === 'medium'
            ? '🟡'
            : '🟢'

        console.log(`   ${severityIcon} [${issue.severity.toUpperCase()}] ${issue.message}`)
        if (issue.file) {
          console.log(`      File: ${issue.file}${issue.line ? `:${issue.line}` : ''}`)
        }
        if (issue.recommendation) {
          console.log(`      💡 ${issue.recommendation}`)
        }
        console.log()
      }
    }
  }

  console.log('='.repeat(60))
  console.log('SUMMARY')
  console.log('='.repeat(60))
  console.log(`\nTotal Issues Found: ${totalIssues}`)
  console.log(`   🔴 Critical: ${criticalCount}`)
  console.log(`   🟠 High:     ${highCount}`)
  console.log(`   🟡 Medium:   ${mediumCount}`)
  console.log(`   🟢 Low:      ${lowCount}`)

  if (criticalCount > 0 || highCount > 0) {
    console.log('\n⚠️  Action required: Fix critical and high severity issues!')
    process.exit(1)
  } else if (mediumCount > 0) {
    console.log('\n⚠️  Review recommended: Medium severity issues found.')
  } else if (totalIssues === 0) {
    console.log('\n✅ No security issues detected!')
  } else {
    console.log('\n✅ Security audit complete.')
  }
}

// Run the audit
runAudit().catch(error => {
  console.error('Error running security audit:', error)
  process.exit(1)
})

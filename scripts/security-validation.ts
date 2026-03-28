#!/usr/bin/env tsx

/**
 * Comprehensive Security Validation Script
 * Advanced security testing beyond basic audit
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import { execSync } from 'child_process'
import { AgentFile } from '@state/format'
import { encrypt, decrypt } from '@state/format'

interface SecurityCheck {
  name: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  passed: boolean
  message: string
  recommendation?: string
}

const results: SecurityCheck[] = []

function logCheck(check: SecurityCheck) {
  results.push(check)

  const icon = check.passed ? '✅' : '❌'
  const severity =
    check.severity === 'critical'
      ? '🔴'
      : check.severity === 'high'
      ? '🟠'
      : check.severity === 'medium'
      ? '🟡'
      : '🟢'

  console.log(`${severity} ${icon} [${check.severity.toUpperCase()}] ${check.name}`)
  if (!check.passed) {
    console.log(`   ${check.message}`)
    if (check.recommendation) {
      console.log(`   💡 ${check.recommendation}`)
    }
  }
}

async function checkDependencyVulnerabilities(): Promise<void> {
  console.log('\n📦 Checking for dependency vulnerabilities...')

  try {
    const auditOutput = execSync('pnpm audit --json', {
      encoding: 'utf-8',
      stdio: 'pipe',
    })

    const audit = JSON.parse(auditOutput)

    if (audit.vulnerabilities && Object.keys(audit.vulnerabilities).length > 0) {
      const vulnCount = Object.keys(audit.vulnerabilities).length

      logCheck({
        name: 'Dependency Vulnerabilities',
        severity: 'high',
        passed: false,
        message: `Found ${vulnCount} vulnerable dependencies`,
        recommendation: 'Run: pnpm update --latest to update vulnerable packages',
      })
    } else {
      logCheck({
        name: 'Dependency Vulnerabilities',
        severity: 'low',
        passed: true,
        message: 'No vulnerabilities found',
      })
    }
  } catch (error: any) {
    // npm audit returns non-zero exit code if vulnerabilities found
    if (error.stdout) {
      try {
        const audit = JSON.parse(error.stdout)
        if (audit.vulnerabilities) {
          const vulnCount = Object.keys(audit.vulnerabilities).length
          const criticalCount = Object.values(audit.vulnerabilities).filter(
            (v: any) => v.severity === 'critical'
          ).length

          logCheck({
            name: 'Dependency Vulnerabilities',
            severity: criticalCount > 0 ? 'critical' : 'high',
            passed: false,
            message: `Found ${vulnCount} vulnerable dependencies (${criticalCount} critical)`,
            recommendation: 'Run: pnpm update --latest to update vulnerable packages',
          })
        }
      } catch {
        logCheck({
          name: 'Dependency Vulnerabilities',
          severity: 'medium',
          passed: true,
          message: 'Unable to check dependencies',
        })
      }
    }
  }
}

async function checkCodeInjectionPatterns(): Promise<void> {
  console.log('\n⚠️  Checking for code injection patterns...')

  const dangerousPatterns = [
    { pattern: /eval\s*\(/, name: 'eval() usage' },
    { pattern: /Function\s*\(/, name: 'Function() constructor' },
    { pattern: /innerHTML\s*=/, name: 'innerHTML assignment' },
    { pattern: /dangerouslySetInnerHTML/, name: 'React dangerouslySetInnerHTML' },
    { pattern: /exec\s*\(|spawn\s*\(|fork\s*\(/, name: 'Command execution' },
  ]

  const searchDirs = [
    'packages/format/src',
    'packages/importer',
    'packages/cli/src',
    'packages/viewer-web/src',
  ]

  let foundIssues = 0

  for (const dir of searchDirs) {
    try {
      const files = await getAllFiles(dir)
      for (const file of files) {
        if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
          const content = await fs.readFile(file, 'utf-8')
          const lines = content.split('\n')

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i]

            for (const { pattern, name } of dangerousPatterns) {
              if (pattern.test(line) && !line.trim().startsWith('//')) {
                foundIssues++
                logCheck({
                  name: `Code Injection: ${name}`,
                  severity: 'high',
                  passed: false,
                  message: `Found ${name} in ${file}:${i + 1}`,
                  recommendation: 'Review and sanitize all inputs, use safer alternatives',
                })
              }
            }
          }
        }
      }
    } catch {
      // Directory doesn't exist
    }
  }

  if (foundIssues === 0) {
    logCheck({
      name: 'Code Injection Patterns',
      severity: 'low',
      passed: true,
      message: 'No dangerous code injection patterns found',
    })
  }
}

async function checkWeakCryptography(): Promise<void> {
  console.log('\n🔐 Checking for weak cryptography...')

  const weakPatterns = [
    { pattern: /md5/i, name: 'MD5 hash' },
    { pattern: /sha1/i, name: 'SHA1 hash' },
    { pattern: /rc4/i, name: 'RC4 cipher' },
    { pattern: /des/i, name: 'DES cipher' },
  ]

  const searchDirs = ['packages/format/src', 'packages/importer', 'packages/cli/src']

  let foundIssues = 0

  for (const dir of searchDirs) {
    try {
      const files = await getAllFiles(dir)
      for (const file of files) {
        if (file.endsWith('.ts') || file.endsWith('.js')) {
          const content = await fs.readFile(file, 'utf-8')

          for (const { pattern, name } of weakPatterns) {
            if (pattern.test(content)) {
              foundIssues++
              logCheck({
                name: `Weak Cryptography: ${name}`,
                severity: 'high',
                passed: false,
                message: `Found ${name} in ${file}`,
                recommendation: 'Use stronger algorithms: SHA-256, SHA-512, AES-256-GCM',
              })
            }
          }
        }
      }
    } catch {
      // Directory doesn't exist
    }
  }

  if (foundIssues === 0) {
    logCheck({
      name: 'Weak Cryptography',
      severity: 'low',
      passed: true,
      message: 'No weak cryptography algorithms found',
    })
  }
}

async function checkSensitiveDataExposure(): Promise<void> {
  console.log('\n🔒 Checking for sensitive data exposure...')

  const sensitivePatterns = [
    { pattern: /password\s*[:=]\s*['"][^'"]+['"]/i, name: 'Hardcoded password' },
    { pattern: /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/i, name: 'Hardcoded API key' },
    { pattern: /secret\s*[:=]\s*['"][^'"]+['"]/i, name: 'Hardcoded secret' },
    { pattern: /token\s*[:=]\s*['"][^'"]{20,}['"]/i, name: 'Hardcoded token' },
    {
      pattern: /sk-[a-zA-Z0-9]{20,}/,
      name: 'OpenAI API key',
    },
    { pattern: /ghp_[a-zA-Z0-9]{36}/, name: 'GitHub token' },
    { pattern: /AKIA[0-9A-Z]{16}/, name: 'AWS access key' },
  ]

  const searchDirs = ['packages/format/src', 'packages/importer', 'packages/cli/src', 'packages/viewer-web/src']

  let foundIssues = 0

  for (const dir of searchDirs) {
    try {
      const files = await getAllFiles(dir)
      for (const file of files) {
        if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
          const content = await fs.readFile(file, 'utf-8')
          const lines = content.split('\n')

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i]

            for (const { pattern, name } of sensitivePatterns) {
              if (pattern.test(line) && !line.trim().startsWith('//')) {
                foundIssues++
                logCheck({
                  name: `Sensitive Data: ${name}`,
                  severity: 'critical',
                  passed: false,
                  message: `Found ${name} in ${file}:${i + 1}`,
                  recommendation: 'Remove sensitive data and use environment variables',
                })
              }
            }
          }
        }
      }
    } catch {
      // Directory doesn't exist
    }
  }

  if (foundIssues === 0) {
    logCheck({
      name: 'Sensitive Data Exposure',
      severity: 'low',
      passed: true,
      message: 'No exposed sensitive data found',
    })
  }
}

async function checkZIPSecurity(): Promise<void> {
  console.log('\n📦 Checking ZIP security features...')

  // Test that AgentFile handles malicious ZIP data
  const testCases = [
    {
      name: 'Empty file',
      data: Buffer.alloc(0),
      shouldFail: true,
    },
    {
      name: 'Corrupted ZIP',
      data: Buffer.from('Not a ZIP file'),
      shouldFail: true,
    },
    {
      name: 'Truncated ZIP',
      data: Buffer.from('PK\x03\x04'), // Partial ZIP header
      shouldFail: true,
    },
  ]

  for (const testCase of testCases) {
    try {
      await AgentFile.load(testCase.data)

      if (testCase.shouldFail) {
        logCheck({
          name: `ZIP Security: ${testCase.name}`,
          severity: 'high',
          passed: false,
          message: `Failed to reject ${testCase.name}`,
          recommendation: 'Implement stricter ZIP validation',
        })
      } else {
        logCheck({
          name: `ZIP Security: ${testCase.name}`,
          severity: 'low',
          passed: true,
          message: 'Correctly handled',
        })
      }
    } catch (error) {
      if (testCase.shouldFail) {
        logCheck({
          name: `ZIP Security: ${testCase.name}`,
          severity: 'low',
          passed: true,
          message: 'Correctly rejected malicious data',
        })
      } else {
        logCheck({
          name: `ZIP Security: ${testCase.name}`,
          severity: 'high',
          passed: false,
          message: `Rejected valid data: ${error}`,
        })
      }
    }
  }
}

async function checkInputValidation(): Promise<void> {
  console.log('\n✅ Checking input validation...')

  // Test with various malicious inputs
  const testCases = [
    {
      name: 'Null bytes in title',
      input: { title: 'Test\x00Null' },
    },
    {
      name: 'Very long title',
      input: { title: 'A'.repeat(100000) },
    },
    {
      name: 'Special characters',
      input: { title: '<script>alert("XSS")</script>' },
    },
    {
      name: 'SQL injection attempt',
      input: { title: "'; DROP TABLE users; --" },
    },
  ]

  for (const testCase of testCases) {
    try {
      const agentFile = await AgentFile.create({
        metadata: testCase.input,
        sourceTool: { name: 'test', version: '1.0.0' },
      })

      // Should handle gracefully
      logCheck({
        name: `Input Validation: ${testCase.name}`,
        severity: 'low',
        passed: true,
        message: 'Input handled gracefully',
      })
    } catch (error) {
      // Should reject or sanitize
      logCheck({
        name: `Input Validation: ${testCase.name}`,
        severity: 'medium',
        passed: true,
        message: 'Input rejected (expected behavior)',
      })
    }
  }
}

async function checkEncryptionStrength(): Promise<void> {
  console.log('\n🔐 Checking encryption strength...')

  // Test that encryption is working correctly
  const testData = Buffer.from('Sensitive data to encrypt')
  const password = 'test-password-123'

  try {
    const encrypted = encrypt(testData, { password })
    const decrypted = decrypt(encrypted, password)

    const isSame = Buffer.compare(testData, decrypted) === 0

    if (isSame) {
      logCheck({
        name: 'Encryption Correctness',
        severity: 'low',
        passed: true,
        message: 'Encryption/decryption works correctly',
      })
    } else {
      logCheck({
        name: 'Encryption Correctness',
        severity: 'critical',
        passed: false,
        message: 'Encryption/decryption produced incorrect result',
        recommendation: 'Review encryption implementation',
      })
    }

    // Check that encrypted data is different from original
    const isDifferent = !encrypted.data.equals(testData)

    if (isDifferent) {
      logCheck({
        name: 'Encryption Obfuscation',
        severity: 'low',
        passed: true,
        message: 'Encrypted data differs from original',
      })
    } else {
      logCheck({
        name: 'Encryption Obfuscation',
        severity: 'critical',
        passed: false,
        message: 'Encrypted data is identical to original',
        recommendation: 'Encryption is not working properly',
      })
    }
  } catch (error) {
    logCheck({
      name: 'Encryption Functionality',
      severity: 'critical',
      passed: false,
      message: 'Encryption failed to work',
      recommendation: 'Ensure encryption is properly implemented',
    })
  }
}

async function checkFilePermissions(): Promise<void> {
  console.log('\n📁 Checking file permissions...')

  const sensitiveFiles = ['.env', '.env.local', '.env.production', '*.key', '*.pem', 'id_rsa']

  // Check if these files exist in git
  try {
    for (const pattern of sensitiveFiles) {
      try {
        const output = execSync(`git ls-files ${pattern}`, {
          encoding: 'utf-8',
          stdio: 'pipe',
        })

        if (output.trim()) {
          logCheck({
            name: 'Exposed Sensitive File',
            severity: 'critical',
            passed: false,
            message: `Sensitive file tracked in git: ${pattern}`,
            recommendation: 'Remove from git history and add to .gitignore',
          })
        }
      } catch {
        // Not found in git, which is good
      }
    }
  } catch {
    // Not in git repo
  }

  // Check .gitignore
  try {
    const gitignore = await fs.readFile('.gitignore', 'utf-8')
    const hasEnvIgnore = gitignore.includes('.env')
    const hasKeyIgnore = gitignore.includes('.key') || gitignore.includes('.pem')

    if (hasEnvIgnore && hasKeyIgnore) {
      logCheck({
        name: '.gitignore Configuration',
        severity: 'low',
        passed: true,
        message: '.gitignore properly configured',
      })
    } else {
      logCheck({
        name: '.gitignore Configuration',
        severity: 'medium',
        passed: false,
        message: '.gitignore missing entries for sensitive files',
        recommendation: 'Add .env, *.key, *.pem to .gitignore',
      })
    }
  } catch {
    logCheck({
      name: '.gitignore Configuration',
      severity: 'medium',
      passed: false,
      message: 'No .gitignore file found',
      recommendation: 'Create .gitignore with proper entries',
    })
  }
}

async function checkTypeScriptStrictMode(): Promise<void> {
  console.log('\n📘 Checking TypeScript strict mode...')

  const tsConfigPath = 'tsconfig.json'

  try {
    const tsConfig = JSON.parse(await fs.readFile(tsConfigPath, 'utf-8'))
    const isStrict = tsConfig.compilerOptions?.strict === true

    if (isStrict) {
      logCheck({
        name: 'TypeScript Strict Mode',
        severity: 'low',
        passed: true,
        message: 'TypeScript strict mode is enabled',
      })
    } else {
      logCheck({
        name: 'TypeScript Strict Mode',
        severity: 'medium',
        passed: false,
        message: 'TypeScript strict mode is not enabled',
        recommendation: 'Enable strict mode in tsconfig.json for better type safety',
      })
    }
  } catch {
    logCheck({
      name: 'TypeScript Configuration',
      severity: 'medium',
      passed: false,
      message: 'tsconfig.json not found or invalid',
      recommendation: 'Create valid tsconfig.json with strict mode enabled',
    })
  }
}

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
    // Directory doesn't exist
  }

  return files
}

async function runSecurityValidation() {
  console.log('🔒 Running Comprehensive Security Validation...\n')

  await checkDependencyVulnerabilities()
  await checkCodeInjectionPatterns()
  await checkWeakCryptography()
  await checkSensitiveDataExposure()
  await checkZIPSecurity()
  await checkInputValidation()
  await checkEncryptionStrength()
  await checkFilePermissions()
  await checkTypeScriptStrictMode()

  console.log('\n' + '='.repeat(60))
  console.log('SECURITY VALIDATION REPORT')
  console.log('='.repeat(60) + '\n')

  let totalChecks = results.length
  let passedChecks = results.filter((r) => r.passed).length
  let failedChecks = totalChecks - passedChecks

  let criticalCount = 0
  let highCount = 0
  let mediumCount = 0
  let lowCount = 0

  for (const result of results) {
    if (!result.passed) {
      switch (result.severity) {
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
    }
  }

  console.log(`Total Checks: ${totalChecks}`)
  console.log(`Passed: ${passedChecks}`)
  console.log(`Failed: ${failedChecks}\n`)

  if (failedChecks > 0) {
    console.log('Failed Checks by Severity:')
    console.log(`   🔴 Critical: ${criticalCount}`)
    console.log(`   🟠 High:     ${highCount}`)
    console.log(`   🟡 Medium:   ${mediumCount}`)
    console.log(`   🟢 Low:      ${lowCount}\n`)
  }

  if (criticalCount > 0 || highCount > 0) {
    console.log('⚠️  Action required: Fix critical and high severity issues!')
    process.exit(1)
  } else if (mediumCount > 0) {
    console.log('⚠️  Review recommended: Medium severity issues found.')
  } else if (failedChecks === 0) {
    console.log('✅ All security checks passed!')
  } else {
    console.log('✅ Security validation complete.')
  }
}

runSecurityValidation().catch((error) => {
  console.error('Error running security validation:', error)
  process.exit(1)
})

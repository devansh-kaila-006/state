import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { existsSync } from 'fs'
import { AgentFile } from '@state/format'

export const validateCommand = new Command('validate')
  .description('Validate .agent file format and integrity')
  .argument('<file>', 'Path to .agent file')
  .option('-v, --verbose', 'Show detailed validation results')
  .action(async (file, options) => {
    const spinner = ora('Validating .agent file...').start()

    try {
      // Check if file exists
      if (!existsSync(file)) {
        spinner.fail(chalk.red('File not found'))
        console.error(chalk.red(`File not found: ${file}`))
        process.exit(1)
      }

      // Load and validate the file
      const agentFile = await AgentFile.load(file)
      const validation = agentFile.validate()

      if (validation.isValid) {
        spinner.succeed(chalk.green('✓ File is valid'))
        console.log(chalk.green('\n✓ All checks passed!'))

        if (options.verbose) {
          const manifest = agentFile.getManifest()
          console.log(chalk.bold('\n📋 Validation Details'))
          console.log(chalk.gray('─'.repeat(50)))

          console.log(`${chalk.yellow('Format Version:')} ${manifest.version}`)
          console.log(`${chalk.yellow('Compression:')} ${agentFile.isCompressed() ? 'Yes' : 'No'}`)
          console.log(`${chalk.yellow('Encrypted:')} ${manifest.encryption?.enabled ? 'Yes' : 'No'}`)
          console.log(`${chalk.yellow('Signed:')} ${manifest.signature ? 'Yes' : 'No'}`)

          const components = manifest.components || []
          if (components.length > 0) {
            console.log(`\n${chalk.cyan('Components:')}`)
            for (const component of components) {
              console.log(`  ${chalk.green('✓')} ${component.name}`)
            }
          }
        }
      } else {
        spinner.fail(chalk.red('✗ Validation failed'))
        console.log(chalk.red('\n✗ Errors found:'))

        if (validation.errors && validation.errors.length > 0) {
          for (const error of validation.errors) {
            console.log(chalk.red(`  ✗ ${error}`))
          }
        }

        if (validation.warnings && validation.warnings.length > 0) {
          console.log(chalk.yellow('\n⚠ Warnings:'))
          for (const warning of validation.warnings) {
            console.log(chalk.yellow(`  ⚠ ${warning}`))
          }
        }

        process.exit(1)
      }
    } catch (error) {
      spinner.fail(chalk.red('Validation failed'))
      console.error(chalk.red((error as Error).message))

      // Provide helpful error messages
      const errorMsg = (error as Error).message
      if (errorMsg.includes('ZIP')) {
        console.log(chalk.yellow('\n💡 Make sure the file is a valid .agent ZIP archive'))
      } else if (errorMsg.includes('manifest')) {
        console.log(chalk.yellow('\n💡 Make sure the file contains a valid manifest.json'))
      } else if (errorMsg.includes('format')) {
        console.log(chalk.yellow('\n💡 Make sure the file follows the .agent format specification'))
      }

      process.exit(1)
    }
  })

import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { importFromLocal } from '@state/importer-claude'
import { importFromExport } from '@state/importer-chatgpt'
import { importFromClipboard, cliImportText } from '@state/importer-manual'

export const importCommand = new Command('import')
  .description('Import conversations into .agent format')

// Claude import subcommand
importCommand
  .command('claude [output]')
  .description('Import from Claude Code local storage')
  .option('-m, --max <number>', 'Maximum number of conversations to import', '10')
  .option('-t, --include-terminal', 'Include terminal history')
  .option('-a, --include-artifacts', 'Include generated artifacts')
  .action(async (output, options) => {
    const spinner = ora('Importing from Claude Code...').start()

    try {
      const agentFiles = await importFromLocal({
        maxConversations: parseInt(options.max),
        includeTerminalHistory: options.includeTerminal,
        includeArtifacts: options.includeArtifacts,
      })

      if (agentFiles.length === 0) {
        spinner.warn('No conversations found in Claude Code local storage')
        return
      }

      spinner.succeed(`Found ${agentFiles.length} conversation(s)`)

      for (let i = 0; i < agentFiles.length; i++) {
        const agentFile = agentFiles[i]
        const manifest = agentFile.getManifest()
        const filename = output || `${manifest.metadata?.title || `claude-${i}`}.agent`

        const saveSpinner = ora(`Saving: ${filename}`).start()
        await agentFile.save(filename)
        saveSpinner.succeed(chalk.green(`✓ Saved: ${filename}`))
      }

      console.log(chalk.green('\n✓ Import complete!'))
    } catch (error) {
      spinner.fail(chalk.red('Import failed'))
      console.error(chalk.red((error as Error).message))
      process.exit(1)
    }
  })

// ChatGPT import subcommand
importCommand
  .command('chatgpt <exportPath> [output]')
  .description('Import from ChatGPT export ZIP file')
  .option('-m, --max <number>', 'Maximum number of conversations to import', '10')
  .option('-c, --include-code', 'Include Code Interpreter outputs')
  .option('-d, --include-dalle', 'Include DALL-E images')
  .action(async (exportPath, output, options) => {
    const spinner = ora('Importing from ChatGPT export...').start()

    try {
      const agentFiles = await importFromExport(exportPath, {
        maxConversations: parseInt(options.max),
        includeCodeInterpreter: options.includeCode,
        includeDALLEImages: options.includeDalle,
      })

      if (agentFiles.length === 0) {
        spinner.warn('No conversations found in ChatGPT export')
        return
      }

      spinner.succeed(`Found ${agentFiles.length} conversation(s)`)

      for (let i = 0; i < agentFiles.length; i++) {
        const agentFile = agentFiles[i]
        const manifest = agentFile.getManifest()
        const filename = output || `${manifest.metadata?.title || `chatgpt-${i}`}.agent`

        const saveSpinner = ora(`Saving: ${filename}`).start()
        await agentFile.save(filename)
        saveSpinner.succeed(chalk.green(`✓ Saved: ${filename}`))
      }

      console.log(chalk.green('\n✓ Import complete!'))
    } catch (error) {
      spinner.fail(chalk.red('Import failed'))
      console.error(chalk.red((error as Error).message))
      process.exit(1)
    }
  })

// Clipboard import subcommand
importCommand
  .command('clipboard [output]')
  .description('Import from system clipboard')
  .option('-t, --title <title>', 'Set conversation title')
  .option('-l, --language <language>', 'Set programming language')
  .action(async (output, options) => {
    const spinner = ora('Reading from clipboard...').start()

    try {
      const result = await importFromClipboard({
        title: options.title,
        language: options.language,
      })

      spinner.succeed(`Detected format: ${chalk.cyan(result.format)}`)
      console.log(`Messages imported: ${chalk.yellow(result.messageCount.toString())}`)

      if (result.warnings.length > 0) {
        console.log(chalk.yellow('\nWarnings:'))
        for (const warning of result.warnings) {
          console.log(chalk.yellow(`  ⚠ ${warning}`))
        }
      }

      const manifest = result.agentFile.getManifest()
      const filename = output || `${manifest.metadata?.title || 'clipboard-import'}.agent`

      const saveSpinner = ora(`Saving: ${filename}`).start()
      await result.agentFile.save(filename)
      saveSpinner.succeed(chalk.green(`✓ Saved: ${filename}`))

      console.log(chalk.green('\n✓ Import complete!'))
    } catch (error) {
      spinner.fail(chalk.red('Import failed'))
      console.error(chalk.red((error as Error).message))
      console.log(chalk.yellow('\nMake sure your terminal has clipboard access permissions.'))
      console.log(chalk.yellow('On Linux, you may need to install xclip or xsel.'))
      process.exit(1)
    }
  })

// Text import subcommand
importCommand
  .command('text <text>')
  .description('Import from text string')
  .option('-o, --output <file>', 'Output file path')
  .option('-t, --title <title>', 'Set conversation title')
  .option('-l, --language <language>', 'Set programming language')
  .action(async (text, options) => {
    const spinner = ora('Importing from text...').start()

    try {
      const result = await cliImportText({
        text,
        output: options.output,
        title: options.title,
        language: options.language,
      })

      spinner.succeed(`Detected format: ${chalk.cyan(result.format)}`)
      console.log(chalk.green('\n✓ Import complete!'))
    } catch (error) {
      spinner.fail(chalk.red('Import failed'))
      console.error(chalk.red((error as Error).message))
      process.exit(1)
    }
  })

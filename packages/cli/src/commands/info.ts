import { Command } from 'commander'
import chalk from 'chalk'
import { getClaudeVersion, isClaudeInstalled, getClaudePaths } from '@state/importer-claude'
import { validateExportFile, getConversationCount } from '@state/importer-chatgpt'
import { validateClipboardAccess, getSupportedFormats } from '@state/importer-manual'

export const infoCommand = new Command('info')
  .description('Show information about the State CLI and available importers')
  .action(async () => {
    console.log(chalk.bold('\n📦 State CLI - .agent File Tool\n'))
    console.log(chalk.gray('─'.repeat(50)))

    // CLI Info
    console.log(chalk.bold('\n🚀 CLI Version:'))
    console.log(`  ${chalk.yellow('Version:')} 0.1.0`)
    console.log(`  ${chalk.yellow('Node.js:')} ${process.version}`)

    // Importer Info
    console.log(chalk.bold('\n📥 Available Importers:'))

    // Claude Importer
    console.log(`\n  ${chalk.cyan('Claude Code')}`)
    const claudeInstalled = await isClaudeInstalled()
    console.log(`    ${chalk.yellow('Status:')} ${claudeInstalled ? chalk.green('✓ Installed') : chalk.red('✗ Not found')}`)
    if (claudeInstalled) {
      const version = await getClaudeVersion()
      const paths = getClaudePaths()
      console.log(`    ${chalk.yellow('Version:')} ${version || 'Unknown'}`)
      console.log(`    ${chalk.yellow('Conversations:')} ${paths.conversations}`)
    }

    // ChatGPT Importer
    console.log(`\n  ${chalk.cyan('ChatGPT')}`)
    console.log(`    ${chalk.yellow('Status:')} ${chalk.green('✓ Available')}`)
    console.log(`    ${chalk.yellow('Format:')} Official export ZIP`)
    console.log(`    ${chalk.yellow('Instructions:')} Export from chat.openai.com → Privacy → Export data`)

    // Manual/Clipboard Importer
    console.log(`\n  ${chalk.cyan('Manual/Clipboard')}`)
    const clipboardAvailable = await validateClipboardAccess()
    console.log(`    ${chalk.yellow('Status:')} ${clipboardAvailable ? chalk.green('✓ Available') : chalk.yellow('⚠ No access')}`)
    const formats = getSupportedFormats()
    console.log(`    ${chalk.yellow('Supported formats:')}`)
    for (const fmt of formats) {
      console.log(`      ${chalk.green('•')} ${fmt.format} - ${fmt.description}`)
    }

    // Examples
    console.log(chalk.bold('\n💡 Usage Examples:'))
    console.log(chalk.cyan('  # Import from Claude Code'))
    console.log(chalk.cyan('  state import claude'))
    console.log('')
    console.log(chalk.cyan('  # Import from ChatGPT export'))
    console.log(chalk.cyan('  state import chatgpt ./export.zip'))
    console.log('')
    console.log(chalk.cyan('  # Import from clipboard'))
    console.log(chalk.cyan('  state import clipboard'))
    console.log('')
    console.log(chalk.cyan('  # View .agent file'))
    console.log(chalk.cyan('  state view conversation.agent'))
    console.log('')
    console.log(chalk.cyan('  # Validate .agent file'))
    console.log(chalk.cyan('  state validate conversation.agent'))
    console.log('')
    console.log(chalk.cyan('  # Export to markdown'))
    console.log(chalk.cyan('  state export conversation.agent -f md'))

    // Help
    console.log(chalk.bold('\n❓ Need Help?'))
    console.log(chalk.cyan('  state <command> --help'))
    console.log(chalk.cyan('  state --help'))
    console.log(chalk.cyan('  https://github.com/state-project/agent'))

    console.log(chalk.gray('\n' + '─'.repeat(50)))
    console.log(chalk.gray('MIT License • https://state.dev\n'))
  })

import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { existsSync } from 'fs'
import { AgentFile } from '@state/format'
import open from 'open'

export const viewCommand = new Command('view')
  .description('View .agent files')
  .argument('<file>', 'Path to .agent file')
  .option('-w, --web', 'Open in web viewer')
  .option('-i, --info', 'Show file information only')
  .action(async (file, options) => {
    const spinner = ora('Loading .agent file...').start()

    try {
      // Check if file exists
      if (!existsSync(file)) {
        spinner.fail(chalk.red('File not found'))
        console.error(chalk.red(`File not found: ${file}`))
        process.exit(1)
      }

      // Load the file
      const agentFile = await AgentFile.load(file)
      spinner.succeed(chalk.green('File loaded successfully'))

      if (options.info) {
        // Show file information
        const manifest = agentFile.getManifest()
        console.log(chalk.bold('\n📄 File Information'))
        console.log(chalk.gray('─'.repeat(50)))
        console.log(`${chalk.yellow('Format Version:')} ${manifest.version}`)
        console.log(`${chalk.yellow('Created:')} ${new Date(manifest.created_at).toLocaleString()}`)
        console.log(`${chalk.yellow('Source Tool:')} ${manifest.source_tool?.name} ${manifest.source_tool?.version || ''}`)

        if (manifest.metadata) {
          console.log(`\n${chalk.cyan('Metadata:')}`)
          if (manifest.metadata.title) {
            console.log(`  ${chalk.yellow('Title:')} ${manifest.metadata.title}`)
          }
          if (manifest.metadata.project_name) {
            console.log(`  ${chalk.yellow('Project:')} ${manifest.metadata.project_name}`)
          }
          if (manifest.metadata.language) {
            console.log(`  ${chalk.yellow('Language:')} ${manifest.metadata.language}`)
          }
        }

        const conversation = agentFile.getConversation()
        if (conversation) {
          console.log(`\n${chalk.cyan('Conversation:')}`)
          console.log(`  ${chalk.yellow('Messages:')} ${conversation.messages.length}`)
          console.log(`  ${chalk.yellow('Context:')} ${conversation.context ? 'Yes' : 'No'}`)
        }

        const components = agentFile.getManifest().components || []
        if (components.length > 0) {
          console.log(`\n${chalk.cyan('Components:')}`)
          for (const component of components) {
            console.log(`  ${chalk.green('✓')} ${component.name} ${chalk.gray(`(${component.version || 'v1.0.0'})`)}`)
          }
        }
      } else if (options.web) {
        // Open in web viewer
        const webViewerUrl = 'https://viewer.state.dev' // Placeholder URL
        spinner.text = 'Opening web viewer...'
        await open(webViewerUrl)
        spinner.succeed(chalk.green('Web viewer opened in browser'))
        console.log(chalk.cyan(`\n💡 Tip: Drag and drop your .agent file into the viewer`))
      } else {
        // Show summary and prompt for web viewer
        const manifest = agentFile.getManifest()
        const conversation = agentFile.getConversation()

        console.log(chalk.bold(`\n📄 ${manifest.metadata?.title || 'Untitled Conversation'}`))
        console.log(chalk.gray('─'.repeat(50)))

        if (conversation) {
          console.log(`${chalk.yellow('Messages:')} ${conversation.messages.length}`)
          console.log(`${chalk.yellow('Source:')} ${manifest.source_tool?.name || 'Unknown'}`)
        }

        console.log(chalk.cyan(`\n💡 Use the --web flag to open in the web viewer`))
        console.log(chalk.cyan(`   Use the --info flag to see detailed information`))
      }
    } catch (error) {
      spinner.fail(chalk.red('Failed to load file'))
      console.error(chalk.red((error as Error).message))
      process.exit(1)
    }
  })

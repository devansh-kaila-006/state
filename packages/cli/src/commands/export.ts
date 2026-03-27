import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { existsSync } from 'fs'
import { writeFile } from 'fs/promises'
import { AgentFile } from '@state/format'

export const exportCommand = new Command('export')
  .description('Export .agent file to other formats')
  .argument('<file>', 'Path to .agent file')
  .option('-f, --format <format>', 'Export format (md, json)', 'md')
  .option('-o, --output <file>', 'Output file path')
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

      // Get conversation data
      const conversation = agentFile.getConversation()
      const manifest = agentFile.getManifest()

      if (!conversation) {
        console.log(chalk.yellow('\n⚠ No conversation data found in file'))
        process.exit(1)
      }

      // Determine output filename
      let outputPath = options.output
      if (!outputPath) {
        const baseName = file.replace(/\.agent$/, '')
        const ext = options.format === 'json' ? 'json' : 'md'
        outputPath = `${baseName}.${ext}`
      }

      spinner.text = 'Exporting...'

      // Export based on format
      if (options.format === 'json') {
        // Export as JSON
        const exportData = {
          manifest,
          conversation: {
            messages: conversation.messages,
            context: conversation.context,
          },
        }

        await writeFile(outputPath, JSON.stringify(exportData, null, 2))
        spinner.succeed(chalk.green(`✓ Exported to JSON: ${outputPath}`))
      } else {
        // Export as Markdown
        let markdown = `# ${manifest.metadata?.title || 'Conversation'}\n\n`
        markdown += `**Source:** ${manifest.source_tool?.name || 'Unknown'}\n`
        markdown += `**Created:** ${new Date(manifest.created_at).toLocaleString()}\n`
        markdown += `**Messages:** ${conversation.messages.length}\n\n`
        markdown += `---\n\n`

        for (const message of conversation.messages) {
          const role = message.role === 'user' ? '👤 User' : '🤖 Assistant'
          markdown += `## ${role}\n\n`
          markdown += `${message.content}\n\n`

          if (message.tools_used && message.tools_used.length > 0) {
            markdown += `**Tools used:**\n`
            for (const tool of message.tools_used) {
              markdown += `- ${tool.name}\n`
            }
            markdown += '\n'
          }

          markdown += `---\n\n`
        }

        await writeFile(outputPath, markdown)
        spinner.succeed(chalk.green(`✓ Exported to Markdown: ${outputPath}`))
      }

      console.log(chalk.green('\n✓ Export complete!'))
    } catch (error) {
      spinner.fail(chalk.red('Export failed'))
      console.error(chalk.red((error as Error).message))
      process.exit(1)
    }
  })

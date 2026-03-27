import { Command } from 'commander'
import chalk from 'chalk'
import inquirer from 'inquirer'
import ora from 'ora'
import { AgentFile, Message } from '@state/format'

export const initCommand = new Command('init')
  .description('Create a new .agent file')
  .option('-t, --title <title>', 'Conversation title')
  .option('-l, --language <language>', 'Programming language')
  .option('-p, --project <name>', 'Project name')
  .option('-o, --output <file>', 'Output file path', 'output.agent')
  .action(async (options) => {
    try {
      let title = options.title
      let language = options.language
      let projectName = options.project
      let output = options.output

      // Interactive prompts if options not provided
      if (!title || !language || !projectName) {
        console.log(chalk.bold('\n🚀 Create a new .agent file\n'))

        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'title',
            message: 'Conversation title:',
            default: title || 'My Conversation',
            when: !title,
          },
          {
            type: 'input',
            name: 'language',
            message: 'Programming language:',
            default: language || 'TypeScript',
            when: !language,
          },
          {
            type: 'input',
            name: 'projectName',
            message: 'Project name:',
            default: projectName || 'my-project',
            when: !projectName,
          },
          {
            type: 'input',
            name: 'output',
            message: 'Output file:',
            default: output,
            when: !output,
          },
        ])

        title = answers.title || title
        language = answers.language || language
        projectName = answers.projectName || projectName
        output = answers.output || output
      }

      const spinner = ora('Creating .agent file...').start()

      // Create the .agent file
      const agentFile = await AgentFile.create({
        metadata: {
          title,
          language,
          project_name: projectName,
        },
        sourceTool: {
          name: 'manual',
          version: '1.0.0',
        },
      })

      // Add a sample conversation
      const sampleMessages: Message[] = [
        {
          id: 'msg-1',
          role: 'user',
          content: `Hello! I'm working on ${projectName}.`,
          timestamp: new Date().toISOString(),
        },
        {
          id: 'msg-2',
          role: 'assistant',
          content: `Hi! I'd be happy to help you with your ${projectName} project. What would you like to work on?`,
          timestamp: new Date().toISOString(),
        },
      ]

      await agentFile.addConversation(sampleMessages)

      // Save the file
      await agentFile.save(output)
      spinner.succeed(chalk.green(`✓ Created: ${output}`))

      console.log(chalk.green('\n✓ .agent file created successfully!'))
      console.log(chalk.cyan(`\n💡 Next steps:`))
      console.log(chalk.cyan(`   Add messages: state import text <message> -o ${output}`))
      console.log(chalk.cyan(`   View file: state view ${output}`))
      console.log(chalk.cyan(`   Validate: state validate ${output}`))
    } catch (error) {
      console.error(chalk.red((error as Error).message))
      process.exit(1)
    }
  })

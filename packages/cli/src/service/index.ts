import _ from 'lodash'
import { generator, runGenerator, runGenerators, prompt } from '@feathershq/pinion'

import { FeathersBaseContext, getDatabaseAdapter } from '../commons'

export interface ServiceGeneratorContext extends FeathersBaseContext {
  /**
   * The chosen service name
   */
  name: string
  /**
   * The path the service is registered on
   */
  path: string
  /**
   * The list of subfolders this service is in
   */
  folder: string[]
  /**
   * The `camelCase` service name starting with a lowercase letter
   */
  camelName: string
  /**
   * The `CamelCase` service name starting with an uppercase letter
   */
  upperName: string
  /**
   * The service class name combined as `CamelCaseService`
   */
  className: string
  /**
   * A kebab-cased (filename friendly) version of the service name
   */
  kebabName: string
  /**
   * The actual filename (the last element of the path)
   */
  fileName: string
  /**
   * Indicates how many file paths we should go up to import other things (e.g. `../../`)
   */
  relative: string
  /**
   * The chosen service type
   */
  type: 'knex' | 'mongodb' | 'custom'
  /**
   * Wether this service uses authentication
   */
  authentication: boolean
  /**
   * Set to true if this service is for an authentication entity
   */
  isEntityService?: boolean
}

/**
 * Parameters the generator is called with
 */
export type ServiceGeneratorArguments = FeathersBaseContext &
  Partial<Pick<ServiceGeneratorContext, 'name' | 'path' | 'type' | 'authentication' | 'isEntityService'>>

export const generate = (ctx: ServiceGeneratorArguments) =>
  generator(ctx)
    .then(
      prompt<ServiceGeneratorArguments, ServiceGeneratorContext>(
        ({ name, path, type, authentication, isEntityService }) => [
          {
            name: 'name',
            type: 'input',
            when: !name,
            message: 'What is the name of your service?'
          },
          {
            name: 'path',
            type: 'input',
            when: !path,
            message: 'Which path should the service be registered on?',
            default: (answers: ServiceGeneratorArguments) => `${_.kebabCase(answers.name)}`
          },
          {
            name: 'authentication',
            type: 'confirm',
            when: authentication === undefined && !isEntityService,
            message: 'Does this service require authentication?'
          },
          {
            name: 'type',
            type: 'list',
            when: !type,
            message: 'What kind of service is it?',
            default: getDatabaseAdapter(ctx.feathers.database),
            choices: [
              {
                value: 'knex',
                name: 'SQL'
              },
              {
                value: 'mongodb',
                name: 'MongoDB'
              },
              {
                value: 'custom',
                name: 'A custom service'
              }
            ]
          }
        ]
      )
    )
    .then(async (ctx) => {
      const { name, path, type } = ctx
      const kebabName = _.kebabCase(name)
      const camelName = _.camelCase(name)
      const upperName = _.upperFirst(camelName)
      const className = `${upperName}Service`

      const folder = path.split('/').filter((el) => el !== '')
      const relative = ['', ...folder].map(() => '..').join('/')
      const fileName = _.last(folder)

      return {
        name,
        type,
        path,
        folder,
        fileName,
        upperName,
        className,
        kebabName,
        camelName,
        relative,
        ...ctx
      }
    })
    .then(runGenerators<ServiceGeneratorContext>(__dirname, 'templates'))
    .then(runGenerator<ServiceGeneratorContext>(__dirname, 'type', ({ type }) => `${type}.tpl`))

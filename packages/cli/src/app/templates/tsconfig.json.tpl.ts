import { generator, toFile, when, writeJSON } from '@feathershq/pinion'
import { AppGeneratorContext } from '../index'

export const generate = (ctx: AppGeneratorContext) =>
  generator(ctx).then(
    when<AppGeneratorContext>(
      (ctx) => ctx.language === 'ts',
      writeJSON<AppGeneratorContext>(
        ({ lib }) => ({
          'ts-node': {
            files: true
          },
          compilerOptions: {
            target: 'es2020',
            module: 'commonjs',
            outDir: './lib',
            rootDir: `./${lib}`,
            strict: true,
            esModuleInterop: true
          },
          include: [lib],
          exclude: ['test']
        }),
        toFile('tsconfig.json')
      )
    )
  )

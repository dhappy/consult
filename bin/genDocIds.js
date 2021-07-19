#!/usr/bin/env node

const { writeFile } = require('fs').promises
const Ceramic = require('@ceramicnetwork/http-client').default
const { createDefinition, publishSchema } = (
  require('@ceramicstudio/idx-tools')
)
const { Ed25519Provider } = require('key-did-provider-ed25519')
const fromString = require('uint8arrays/from-string')
const KeyResolver = require('key-did-resolver').default
const { DID } = require('dids')

const out = 'src/ceramicIds.json'
const CERAMIC_URL = (
  process.env.CERAMIC_URL || 'https://d12-a-ceramic.3boxlabs.com'
)

async function run() {
  const Schemas = {
    ConsultVideoMetadata: (
      (await import('../src/video.metadata.schema.mjs')).default
    ),
    ConsultVideoIndex: (
      (await import('../src/video.index.schema.mjs')).default
    ),
  }

  console.info({ Schemas })

  if(!process.env.SEED) {
    throw new Error("Environment Variable $SEED Required\nexport SEED=$(node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\")")
  }
  // The seed must be provided as an environment variable
  const seed = fromString(process.env.SEED, 'base16')
  // Connect to the local Ceramic node
  const ceramic = new Ceramic(CERAMIC_URL)
  // Authenticate the Ceramic instance with the provider
  const provider = new Ed25519Provider(seed)
  const did = new DID({
    provider,
    resolver: KeyResolver.getResolver(),
  })

  await did.authenticate()
  ceramic.did = did

  const published = Object.fromEntries(
    await Promise.all(Object.entries(Schemas).map(
      async ([name, schema]) => ([
        name,
        await publishSchema(ceramic, { content: schema })
      ])
    ))
  )

  const definitions = Object.fromEntries(
    await Promise.all(Object.entries(published).map(
      async ([name, schema]) => ([
        name,
        await createDefinition(ceramic, {
          name,
          description: Schemas[name].description ?? null,
          schema: schema.commitId.toUrl(),
        })
      ])
    ))
  )

  const config = {
    definitions: Object.fromEntries(
      await Promise.all(Object.entries(definitions).map(
        async ([name, definition]) => ([
          name, definition.id.toUrl(),
        ])
      ))
    ),
    schemas: Object.fromEntries(
      await Promise.all(Object.entries(published).map(
        async ([name, schema]) => ([
          name, schema.commitId.toUrl(),
        ])
      ))
    ),
  }
  await writeFile(`./${out}`, JSON.stringify(config, null, 2))

  console.log(`Config written to ${out} file:`, config)
  process.exit(0)
}

run().catch(console.error)
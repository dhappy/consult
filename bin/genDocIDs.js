#!/usr/bin/env node

const { writeFile } = require('fs').promises
const Ceramic = require('@ceramicnetwork/http-client').default
const { createDefinition, publishSchema } = require('@ceramicstudio/idx-tools')
const { Ed25519Provider } = require('key-did-provider-ed25519')
const fromString = require('uint8arrays/from-string')
const KeyResolver = require('key-did-resolver').default
const { DID } = require('dids')
const ConsultSchema = require('../src/org.dhappy.consult.schema.json')

const out = 'src/docIDs.json'
const CERAMIC_URL = (
  process.env.CERAMIC_URL || 'https://d12-a-ceramic.3boxlabs.com'
)

async function run() {
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
  //ceramic.setDID(did)
  ceramic.did = did

  // Publish the two schemas
  const consultSchema = await (
    publishSchema(ceramic, { content: ConsultSchema })
  )

  // Create the definition using the created schema ID
  const consultDefinition = await createDefinition(ceramic, {
    name: 'VideoEvents',
    description: 'List of events correlating to the progress of a video.', // optional
    schema: consultSchema.commitId.toUrl(),
  })

  // Write config to JSON file
  const config = {
    definitions: {
      consult: consultDefinition.id.toUrl(),
    },
    schemas: {
      consult: consultSchema.commitId.toUrl(),
    },
  }
  await writeFile(`./${out}`, JSON.stringify(config, null, 2))

  console.log(`Config written to ${out} file:`, config)
  process.exit(0)
}

run().catch(console.error)
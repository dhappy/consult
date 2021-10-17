#!/usr/bin/env -S node --experimental-json-modules

import { access, readFile, writeFile } from 'node:fs/promises'
import { constants } from 'fs'
import { CeramicClient } from '@ceramicnetwork/http-client'
import { ModelManager } from '@glazed/devtools'
import { DID } from 'dids'
import { Ed25519Provider } from 'key-did-provider-ed25519'
import { getResolver } from 'key-did-resolver'
import { fromString } from 'uint8arrays'
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

;(async () => {
  let raw = process.env.DID_KEY
  if(!raw) {
    try {
      const keyFile = `${__dirname}/../private.key`
      await access(keyFile, constants.R_OK)
      raw = (await readFile(keyFile, 'utf8')).trim()
    } catch {}
  }
  if(!raw) {
    console.warn('$DID_KEY must be set or private.key must exist.')
    console.warn('Generate it with `openssl rand -hex 32`.')
    process.exit(-2)
  }

  const key = fromString(raw, 'base16')
  const did = new DID({
    provider: new Ed25519Provider(key),
    resolver: getResolver(),
  })
  await did.authenticate()

  const ceramicURI = (
    process.env.CERAMIC_URI
    || 'http://localhost:7007'
  )
  console.info(`Connecting to ${ceramicURI}`)
  const ceramic = new CeramicClient(ceramicURI)
  ceramic.did = did

  const manager = new ModelManager(ceramic)

  const $schema = (
    'http://json-schema.org/draft-07/schema#'
  )
  const schemaId = await manager.createSchema(
    'VideoList',
    {
      $schema,
      title: 'VideoList',
      type: 'object',
      properties: {
        videos: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                maxLength: 400,
              },
              uri: {
                type: 'string',
                maxLength: 200,
              },
            },
          },
        },
      },
    }
  )
  const schemaURI = manager.getSchemaURL(schemaId)
  console.info(`Wrote schema to "${schemaURI}".`)

  await manager.createDefinition(
    'publicVideos',
    {
      name: 'Public videos list',
      description: 'List of publicly visible recordings of community calls and pair programming sessions.',
      schema: schemaURI,
    }
  )
 
  await manager.createTile(
    'buildersAlign',
    {
      videos: [
        {
          title: 'MetaGame’s Builders’ Align for 1443/2/28‒3/6',
          uri: 'ipfs://QmbPtAgWbNDo2Zwsv8RR7WNsLySkMb71QyEenuCcGPENaE/MetaGame’s%20Builders’%20Align%20for%201443⁄2⁄28‒3⁄6.json5'
        }
      ]
    },
    { schema: schemaURI },
  )

  const model = await manager.toPublished()
  const out = `${__dirname}/../src/ceramicIds.json`
  await writeFile(out, JSON.stringify(model, null, 2))

  console.info(`Wrote ids to "${out}"."`)
})()
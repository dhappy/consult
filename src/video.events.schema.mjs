export default {
  '$schema': 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  title: 'Consult Video Events',
  description: 'The IPFS link to the JSON description of a series of event descriptions that correspond to a video.',
  properties: {
    events: {
      type: 'object',
      properties: {
        '^tip:.*$': {
          type: 'string',
          pattern: '^ipfs://.+$',
          maxLength: 500,
        },
      },
    },
  },
}
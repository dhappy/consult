export default {
  '$schema': 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  title: 'Consult Video Metadata',
  description: 'Information about an evented video.',
  properties: {
    id: { type: 'string' },
    title: { type: 'string' },
    url: { type: 'string' },
    startTime: { type: 'string' },
    events: {
      type: 'string',
      pattern: '^ipfs://.+',
      maxLength: 500
    },
  },
}
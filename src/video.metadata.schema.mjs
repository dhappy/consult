export default {
  '$schema': 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  title: 'Consult Video Metadata',
  description: 'Information about an evented video.',
  properties: {
    id: { type: 'string' },
    title: { type: 'string' },
    url: { type: 'uri' },
    startTime: { type: 'date-time' },
    events: {
      type: 'uri',
      pattern: '^ipfs://.+',
      maxLength: 500
    },
  },
}
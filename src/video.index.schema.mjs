export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  title: 'Consult Video Index',
  description: 'Ceramic links to evented video metadata.',
  properties: {
    events: {
      type: 'object',
      properties: {
        '^.+$': {
          type: 'string',
          pattern: '^ceramic://.+$',
          maxLength: 500,
        },
      },
    },
  },
}
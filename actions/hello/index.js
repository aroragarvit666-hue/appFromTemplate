const { Core } = require('@adobe/aio-sdk')

async function main(params) {
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })
  try {
    logger.info('Action invoked')
    logger.debug('Params:', JSON.stringify(params))

    // Extract IMS token (require-adobe-auth: true injects it)
    const token = params.__ow_headers?.authorization?.replace('Bearer ', '')
    logger.debug('IMS token present:', Boolean(token))

    const name = params.name || 'World'
    const result = { message: `Hello, ${name}!` }

    logger.info('Action completed successfully')
    return { statusCode: 200, body: result }
  } catch (error) {
    logger.error('Action failed:', error.message)
    return { statusCode: 500, body: { error: error.message } }
  }
}

exports.main = main

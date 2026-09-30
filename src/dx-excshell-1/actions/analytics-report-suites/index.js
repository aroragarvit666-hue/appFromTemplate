/*
* <license header>
*/

/**
 * Lists all Adobe Analytics report suites available to the authenticated org.
 * Used to populate the report-suite Picker in the Analytics Dashboard tab.
 */

const { Core } = require('@adobe/aio-sdk')
const { errorResponse, stringParameters, checkMissingRequestInputs } = require('../utils')
const { initAnalytics } = require('../lib/analytics')

async function main (params) {
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })

  try {
    logger.info('Calling analytics-report-suites')
    logger.debug(stringParameters(params))

    // require-adobe-auth injects the user token; the SDK still needs the S2S creds + apiKey
    const errorMessage = checkMissingRequestInputs(params, ['apiKey'], ['Authorization'])
    if (errorMessage) {
      return errorResponse(400, errorMessage, logger)
    }

    const { client } = await initAnalytics(params)

    // getCollections lists report suites (rsid + name) for a UI dropdown
    const res = await client.getCollections({ limit: 100 })
    const suites = (res.body.content || []).map((s) => ({ rsid: s.rsid, name: s.name }))

    logger.info(`200: returning ${suites.length} report suites`)
    return {
      statusCode: 200,
      body: { suites }
    }
  } catch (error) {
    // aio-lib throws error objects, not HTTP responses
    logger.error(error)
    const message = error.message || 'server error'
    return errorResponse(500, `failed to list report suites: ${message}`, logger)
  }
}

exports.main = main

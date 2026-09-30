/*
* <license header>
*/

/**
 * Runs an Adobe Analytics report for a given report suite and date range.
 * Returns a daily breakdown of pageviews / visits / visitors for the dashboard.
 */

const { Core } = require('@adobe/aio-sdk')
const { errorResponse, stringParameters, checkMissingRequestInputs } = require('../utils')
const { initAnalytics } = require('../lib/analytics')

// Metrics reported, in column order. Kept in one place so the client can render headers.
const METRICS = [
  { columnId: '0', id: 'metrics/pageviews', name: 'Page Views' },
  { columnId: '1', id: 'metrics/visits', name: 'Visits' },
  { columnId: '2', id: 'metrics/visitors', name: 'Visitors' }
]

async function main (params) {
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })

  try {
    logger.info('Calling analytics-report')
    logger.debug(stringParameters(params))

    const errorMessage = checkMissingRequestInputs(
      params,
      ['apiKey', 'rsid', 'startDate', 'endDate'],
      ['Authorization']
    )
    if (errorMessage) {
      return errorResponse(400, errorMessage, logger)
    }

    const { client } = await initAnalytics(params)

    // Analytics 2.0 date range is an ISO interval: start (inclusive) / end (exclusive)
    const dateRange = `${params.startDate}T00:00:00.000/${params.endDate}T00:00:00.000`

    const reportBody = {
      rsid: params.rsid,
      globalFilters: [
        { type: 'dateRange', dateRange }
      ],
      metricContainer: {
        metrics: METRICS.map(({ columnId, id }) => ({ columnId, id }))
      },
      dimension: 'variables/daterangeday',
      settings: { limit: 400, page: 0, nonesBehavior: 'return-nones' }
    }

    const res = await client.getReport(reportBody)
    const report = res.body

    // Flatten SDK rows into a client-friendly shape: { day, pageviews, visits, visitors }
    const rows = (report.rows || []).map((row) => ({
      day: row.value,
      values: row.data
    }))

    logger.info(`200: report returned ${rows.length} rows`)
    return {
      statusCode: 200,
      body: {
        rsid: params.rsid,
        columns: METRICS.map((m) => m.name),
        rows,
        totalElements: report.totalElements
      }
    }
  } catch (error) {
    logger.error(error)
    const message = error.message || 'server error'
    return errorResponse(500, `failed to run report: ${message}`, logger)
  }
}

exports.main = main

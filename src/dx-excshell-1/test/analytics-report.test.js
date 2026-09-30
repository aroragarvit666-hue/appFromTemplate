/*
* <license header>
*/

jest.mock('@adobe/aio-sdk', () => ({
  Core: { Logger: jest.fn() }
}))
const { Core } = require('@adobe/aio-sdk')
const mockLoggerInstance = { info: jest.fn(), debug: jest.fn(), error: jest.fn() }
Core.Logger.mockReturnValue(mockLoggerInstance)

jest.mock('./../actions/lib/analytics')
const { initAnalytics } = require('./../actions/lib/analytics')

const action = require('./../actions/analytics-report/index.js')

beforeEach(() => {
  Core.Logger.mockClear()
  mockLoggerInstance.info.mockReset()
  mockLoggerInstance.debug.mockReset()
  mockLoggerInstance.error.mockReset()
  initAnalytics.mockReset()
})

const okParams = {
  apiKey: 'k',
  rsid: 'rs1',
  startDate: '2026-09-01',
  endDate: '2026-09-08',
  __ow_headers: { authorization: 'Bearer fake' }
}

describe('analytics-report', () => {
  test('main should be defined', () => {
    expect(action.main).toBeInstanceOf(Function)
  })

  test('returns 400 when required params are missing', async () => {
    const response = await action.main({ apiKey: 'k', __ow_headers: { authorization: 'Bearer fake' } })
    expect(response.error.statusCode).toBe(400)
    expect(response.error.body.error).toContain('rsid')
  })

  test('returns 200 with columns and rows', async () => {
    const getReport = jest.fn().mockResolvedValue({
      body: {
        rows: [
          { value: 'Sep 1, 2026', data: [100, 80, 60] },
          { value: 'Sep 2, 2026', data: [120, 90, 70] }
        ],
        totalElements: 2
      }
    })
    initAnalytics.mockResolvedValue({ client: { getReport } })

    const response = await action.main(okParams)
    expect(response.statusCode).toBe(200)
    expect(response.body.rsid).toBe('rs1')
    expect(response.body.columns).toEqual(['Page Views', 'Visits', 'Visitors'])
    expect(response.body.rows).toHaveLength(2)
    expect(response.body.rows[0]).toEqual({ day: 'Sep 1, 2026', values: [100, 80, 60] })

    // date range built as an ISO interval from start/end
    const sentBody = getReport.mock.calls[0][0]
    expect(sentBody.globalFilters[0].dateRange).toBe('2026-09-01T00:00:00.000/2026-09-08T00:00:00.000')
  })

  test('returns 500 when the SDK throws', async () => {
    initAnalytics.mockResolvedValue({
      client: { getReport: jest.fn().mockRejectedValue(new Error('bad rsid')) }
    })
    const response = await action.main(okParams)
    expect(response.error.statusCode).toBe(500)
    expect(response.error.body.error).toContain('bad rsid')
    expect(mockLoggerInstance.error).toHaveBeenCalled()
  })
})

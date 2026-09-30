/*
* <license header>
*/

jest.mock('@adobe/aio-sdk', () => ({
  Core: { Logger: jest.fn() }
}))
const { Core } = require('@adobe/aio-sdk')
const mockLoggerInstance = { info: jest.fn(), debug: jest.fn(), error: jest.fn() }
Core.Logger.mockReturnValue(mockLoggerInstance)

// mock the analytics lib so we don't hit IMS / the network
jest.mock('./../actions/lib/analytics')
const { initAnalytics } = require('./../actions/lib/analytics')

const action = require('./../actions/analytics-report-suites/index.js')

beforeEach(() => {
  Core.Logger.mockClear()
  mockLoggerInstance.info.mockReset()
  mockLoggerInstance.debug.mockReset()
  mockLoggerInstance.error.mockReset()
  initAnalytics.mockReset()
})

const okParams = { apiKey: 'k', __ow_headers: { authorization: 'Bearer fake' } }

describe('analytics-report-suites', () => {
  test('main should be defined', () => {
    expect(action.main).toBeInstanceOf(Function)
  })

  test('returns 400 when Authorization header is missing', async () => {
    const response = await action.main({ apiKey: 'k' })
    expect(response.error.statusCode).toBe(400)
    expect(response.error.body.error).toContain('authorization')
  })

  test('returns 400 when apiKey is missing', async () => {
    const response = await action.main({ __ow_headers: { authorization: 'Bearer fake' } })
    expect(response.error.statusCode).toBe(400)
    expect(response.error.body.error).toContain('apiKey')
  })

  test('returns 200 with a list of report suites', async () => {
    initAnalytics.mockResolvedValue({
      client: {
        getCollections: jest.fn().mockResolvedValue({
          body: { content: [{ rsid: 'rs1', name: 'Suite One' }, { rsid: 'rs2', name: 'Suite Two' }] }
        })
      }
    })
    const response = await action.main(okParams)
    expect(response.statusCode).toBe(200)
    expect(response.body.suites).toEqual([
      { rsid: 'rs1', name: 'Suite One' },
      { rsid: 'rs2', name: 'Suite Two' }
    ])
  })

  test('returns 500 when the SDK throws', async () => {
    initAnalytics.mockRejectedValue(new Error('boom'))
    const response = await action.main(okParams)
    expect(response.error.statusCode).toBe(500)
    expect(response.error.body.error).toContain('boom')
    expect(mockLoggerInstance.error).toHaveBeenCalled()
  })
})

/*
* <license header>
*/

import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import {
  Flex,
  View,
  Heading,
  Content,
  Picker,
  Item,
  Button,
  ProgressCircle,
  InlineAlert,
  TableView,
  TableHeader,
  TableBody,
  Column,
  Row,
  Cell
} from '@adobe/react-spectrum'

import allActions from '../config.json'
import actionWebInvoke from '../utils'

// config.json keys are prefixed with the package name (e.g. 'dx-excshell-1/analytics-report').
// Resolve by the action's short name so we don't hardcode the package.
function actionUrl (shortName) {
  const key = Object.keys(allActions).find((k) => k.endsWith(`/${shortName}`) || k === shortName)
  return key ? allActions[key] : ''
}

const DATE_RANGES = [
  { id: '7', name: 'Last 7 days' },
  { id: '30', name: 'Last 30 days' },
  { id: '90', name: 'Last 90 days' }
]

// Returns { startDate, endDate } as YYYY-MM-DD; endDate is exclusive (tomorrow) so today counts.
function computeRange (days) {
  const toISODate = (d) => d.toISOString().slice(0, 10)
  const end = new Date()
  end.setDate(end.getDate() + 1)
  const start = new Date()
  start.setDate(start.getDate() - Number(days))
  return { startDate: toISODate(start), endDate: toISODate(end) }
}

const AnalyticsDashboard = (props) => {
  const [suites, setSuites] = useState([])
  const [selectedSuite, setSelectedSuite] = useState(null)
  const [selectedRange, setSelectedRange] = useState('7')
  const [suitesLoading, setSuitesLoading] = useState(true)
  const [reportLoading, setReportLoading] = useState(false)
  const [error, setError] = useState(null)
  const [report, setReport] = useState(null)

  const headers = {
    authorization: `Bearer ${props.ims.token}`,
    'x-gw-ims-org-id': props.ims.org
  }

  // 1. On load: fetch available report suites and populate the Picker.
  useEffect(() => {
    let cancelled = false
    async function loadSuites () {
      const url = actionUrl('analytics-report-suites')
      if (!url) {
        // config.json is empty until deployed or a sandbox preview is running
        setSuitesLoading(false)
        setError('Report-suite action is not deployed yet. Run `aio app deploy` (or start a preview) to populate action URLs.')
        return
      }
      try {
        const res = await actionWebInvoke(url, headers, {})
        if (cancelled) return
        setSuites(res.suites || [])
        setSuitesLoading(false)
      } catch (e) {
        if (cancelled) return
        console.error(e)
        setError(e.message)
        setSuitesLoading(false)
      }
    }
    loadSuites()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 2 + 3. Run the report for the selected suite + date range, then render it.
  async function loadReport () {
    setError(null)
    setReport(null)
    const url = actionUrl('analytics-report')
    if (!url) {
      setError('Report action is not deployed yet. Run `aio app deploy` to populate action URLs.')
      return
    }
    setReportLoading(true)
    try {
      const { startDate, endDate } = computeRange(selectedRange)
      const res = await actionWebInvoke(url, headers, { rsid: selectedSuite, startDate, endDate })
      setReport(res)
    } catch (e) {
      console.error(e)
      setError(e.message)
    } finally {
      setReportLoading(false)
    }
  }

  return (
    <View width="100%">
      <Heading level={1}>Adobe Analytics Dashboard</Heading>
      <Content>
        Select a report suite and a date range, then load daily traffic metrics.
      </Content>

      {error && (
        <View marginTop="size-200" marginBottom="size-200">
          <InlineAlert variant="negative">
            <Heading>Something went wrong</Heading>
            <Content>{error}</Content>
          </InlineAlert>
        </View>
      )}

      {suitesLoading
        ? (
          <Flex alignItems="center" justifyContent="center" height="size-3000">
            <ProgressCircle aria-label="Loading report suites" isIndeterminate size="L" />
          </Flex>
          )
        : (
          <Flex direction="row" gap="size-200" alignItems="end" wrap marginTop="size-200">
            <Picker
              label="Report suite"
              placeholder="Select a report suite"
              width="size-3600"
              items={suites.map((s) => ({ id: s.rsid, name: `${s.name} (${s.rsid})` }))}
              selectedKey={selectedSuite}
              onSelectionChange={(key) => setSelectedSuite(key)}
            >
              {(item) => <Item key={item.id}>{item.name}</Item>}
            </Picker>

            <Picker
              label="Date range"
              width="size-2400"
              items={DATE_RANGES}
              selectedKey={selectedRange}
              onSelectionChange={(key) => setSelectedRange(key)}
            >
              {(item) => <Item key={item.id}>{item.name}</Item>}
            </Picker>

            <Button
              variant="accent"
              onPress={loadReport}
              isPending={reportLoading}
              isDisabled={!selectedSuite}
            >
              Load Report
            </Button>
          </Flex>
          )}

      {reportLoading && (
        <Flex alignItems="center" justifyContent="center" height="size-3000">
          <ProgressCircle aria-label="Loading report" isIndeterminate size="L" />
        </Flex>
      )}

      {!reportLoading && report && (
        <View marginTop="size-300">
          <Heading level={3}>
            Daily metrics — {report.rsid}
          </Heading>
          <TableView
            aria-label="Adobe Analytics daily report"
            renderEmptyState={() => (
              <Flex direction="column" alignItems="center" gap="size-100">
                <Heading level={4}>No data</Heading>
                <Content>This report suite has no data for the selected range.</Content>
              </Flex>
            )}
          >
            <TableHeader>
              <Column key="day">Day</Column>
              {report.columns.map((c) => (
                <Column key={c} align="end">{c}</Column>
              ))}
            </TableHeader>
            <TableBody items={report.rows.map((r, i) => ({ id: i, ...r }))}>
              {(row) => (
                <Row key={row.id}>
                  <Cell>{row.day}</Cell>
                  {row.values.map((v, i) => (
                    <Cell key={i}>{Number(v).toLocaleString()}</Cell>
                  ))}
                </Row>
              )}
            </TableBody>
          </TableView>
        </View>
      )}
    </View>
  )
}

AnalyticsDashboard.propTypes = {
  runtime: PropTypes.any,
  ims: PropTypes.any
}

export default AnalyticsDashboard

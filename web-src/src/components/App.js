import React, { useState } from 'react'
import {
  Provider,
  defaultTheme,
  View,
  Flex,
  Heading,
  Content,
  TextField,
  Button,
  InlineAlert,
  ProgressCircle,
  Well,
} from '@adobe/react-spectrum'
import actions from '../config.json'


//Sample Change
export default function App({ runtime, ims }) {
  // Do NOT call runtime.done() here — index.js calls it in the ready handler
  const helloUrl = actions['hello'] // exact action name from app.config.yaml

  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  async function sayHello() {
    setError('')
    setMessage('')

    if (!helloUrl) {
      // config.json is empty before deploy / preview
      setError('Action URL not available yet. Deploy the app or start the sandbox to call the action.')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch(helloUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ims.token}`,
          'x-gw-ims-org-id': ims.org,
        },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) throw new Error(`Action failed: ${res.status}`)
      const data = await res.json()
      setMessage(data.message)
    } catch (e) {
      setError(e.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Provider theme={defaultTheme}>
      <View padding="size-400" maxWidth="size-6000" marginX="auto">
        <Flex direction="column" gap="size-300">
          <Heading level={1}>Hello World App</Heading>
          <Content>Enter a name and call the App Builder action to get a greeting.</Content>

          <TextField
            label="Name"
            value={name}
            onChange={setName}
            onSubmit={sayHello}
            width="100%"
          />

          <Button
            variant="accent"
            onPress={sayHello}
            isPending={isLoading}
            alignSelf="start"
          >
            Say Hello
          </Button>

          {isLoading && (
            <Flex alignItems="center" justifyContent="center" height="size-1000">
              <ProgressCircle aria-label="Calling action" isIndeterminate />
            </Flex>
          )}

          {message && (
            <Well>
              <Heading level={3} margin={0}>{message}</Heading>
            </Well>
          )}

          {error && (
            <InlineAlert variant="negative">
              <Heading>Error</Heading>
              <Content>{error}</Content>
            </InlineAlert>
          )}
        </Flex>
      </View>
    </Provider>
  )
}

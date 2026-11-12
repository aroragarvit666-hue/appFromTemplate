# helloWorldApp

A minimal Adobe App Builder app: one authenticated web action (`hello`) and an
Experience Cloud Shell React SPA (React Spectrum) that calls it.

## Structure

- `actions/hello/index.js` — web action returning `Hello, <name>!`
- `web-src/` — ExC Shell React SPA
- `test/hello.test.js` — Jest tests for the action

## Develop

```bash
npm install
aio app use          # select org / project / workspace
aio app run          # local dev with UI
aio app deploy       # build + deploy to Adobe I/O Runtime
npm test             # run action tests
```

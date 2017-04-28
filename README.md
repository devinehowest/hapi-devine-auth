# hapi-devine-auth

## Description

🔧  This Hapi plugin adds authentication options to request, reply and server

## Install hapi-devine-auth

```bash
yarn add hapi-devine-auth
```

## Usage

register this module as a plugin in Hapi

```js

server.register({

  register: require(`hapi-devine-auth`),

  options: {
    issuer: 'http://localhost:3000', // token issuer (required)
    secret: 'uiuGIU67383tuihiueeeuoih3368982676jhvuygoioo' // token secret (required)
  }

}, pluginHandler);

```

## License

MIT

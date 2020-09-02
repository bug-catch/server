# Bug Catch
Catch all errors and log custom events within any website.

[Browser](https://github.com/bug-catch/browser) / [__Server__](https://github.com/bug-catch/server)




## Usage

### Install

```bash
$ npm install --save @bug-catch/server
```


### Initiate
Bugcatch server is initiated as `express middleware`. This way you can integrate it with your existing API (or just create a simple express server that only uses `bugcatch`)

```javascript
const express    = require("express");
const bugcatch = require("@bug-catch/server");

const server = express();

server.use("/bugcatch", bugcatch); // --> set custom route; e.g. server.use("/myapi/stats/bugs", bugcatch)
server.use("/", other_routes);
```

__Thats it!__ - sit back and try not to panic as the bugs roll in!




<br>

## License
[Apache-2.0 License](LICENSE)

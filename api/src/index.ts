import { env } from "./infrastructure/config/env.js";
import { createApp } from "./presentation/app.js";

/** Composition root: read the environment, build the app, start listening. */
const app = createApp();

app.listen(env.PORT, () => {
  // The structured logger from the stack spec replaces this when the first logging feature lands.
  console.log(`API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
});

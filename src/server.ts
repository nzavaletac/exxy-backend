import { app } from './app';
import { connect } from './database';

const port = process.env.PORT || 8000;

(async function () {
  await connect();
})();

app.listen(port, () => {
  console.log(`App running at http://localhost:${port}`);
});

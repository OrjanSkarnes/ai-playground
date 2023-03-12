const mongoose = require("mongoose");

import { logger } from "./logger"

const connection: any = {};

async function dbConnect() {
  if (connection.isConnected) {
    // Use existing database connection
    return;
  }

  // Use new database connection
  const db = await mongoose.connect(
    process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })

  connection.isConnected = db.connections[0].readyState;
  logger.info("dbConnect:::::connection.isConnected:::::" + connection.isConnected);
}
export default dbConnect;
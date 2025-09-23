import mongoose from "mongoose";

const MAX_RETRIES = 3;
const RETRY_INTERVAL = 5000;

class DatabaseConnection {
  constructor() {
    this.retryCount = 0;
    this.isConnected = false;

    mongoose.set("strictQuery", true);

    mongoose.connection.on("connected", () => {
      console.log(
        `✅ MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`
      );
      this.isConnected = true;
    });

    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err);
      this.isConnected = false;
    });

    mongoose.connection.on("disconnected", () => {
      console.log("⚠️ MongoDB disconnected");
      this.isConnected = false;
    });
  }

  async connect() {
    if (this.isConnected || mongoose.connection.readyState === 1) {
      return; // Already connected
    }

    if (!process.env.MONGODB_URI) {
      throw new Error("MongoDB URI is not defined in environment variables");
    }

    try {
      const options = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4,
      };

      if (process.env.NODE_ENV === "development" && !mongoose.get("debug")) {
        mongoose.set("debug", true);
      }

      await mongoose.connect(process.env.MONGODB_URI, options);
      this.retryCount = 0;
    } catch (error) {
      console.error("Failed to connect to MongoDB:", error.message);
      await this.handleConnectionError();
    }
  }

  async handleConnectionError() {
    if (this.retryCount < MAX_RETRIES) {
      this.retryCount++;
      console.log(
        `Retrying connection... Attempt ${this.retryCount} of ${MAX_RETRIES}`
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL));
      return this.connect();
    } else {
      throw new Error("MongoDB connection failed after max retries");
    }
  }

  getConnectionStatus() {
    const { readyState, host, name } = mongoose.connection;
    return {
      isConnected: this.isConnected,
      readyState,
      host: host || null,
      name: name || null,
    };
  }
}

const dbConnection = new DatabaseConnection();

export default dbConnection.connect.bind(dbConnection);
export const getDBStatus = dbConnection.getConnectionStatus.bind(dbConnection);
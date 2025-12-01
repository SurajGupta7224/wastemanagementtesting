
require("dotenv").config();
require("./config/db");
const express = require("express");
const cors = require("cors");
const app = express();
const allowedOrigins = [
  "http://localhost:3000",  
  "http://localhost:5173"   
];
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS policy: Origin not allowed"));
      }
    },
    credentials: true
  })
);
app.use((req, res, next) => {
  console.log("Incoming request origin:", req.headers.origin);
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const adminRoutes = require("./routes/admin.routes");
app.use("/api/admin", adminRoutes);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);

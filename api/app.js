import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";


import authRoute from "./routes/authRoute.js";
import userRoute from "./routes/userRoute.js";
import workScheduleRoute from "./routes/workScheduleRoute.js";
import payrollRoute from "./routes/payrollRoute.js";
import attendanceRoute from "./routes/attendanceRoute.js";
import leaveRoute from "./routes/leaveRoute.js";
import contractRoute from "./routes/contractRoute.js";
import employeeRoute from "./routes/employeeRoute.js";
import dashboardRoute from "./routes/dashboardRoute.js";
import notifications from "./routes/notificationsRoute.js";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

app.use(express.json());
app.use(cors({
  origin: ["http://localhost:5173"],
  methods: ["POST", "GET", "PUT", "DELETE"],
  credentials: true,
}));
app.use(cookieParser());

app.use("/api/auth", authRoute);
app.use("/api/user", userRoute);
app.use("/api/work-schedules", workScheduleRoute);
app.use("/api/payroll", payrollRoute);
app.use("/api/attendance", attendanceRoute);
app.use("/api/leave", leaveRoute);
app.use("/api/contracts", contractRoute);
app.use("/api/employee", employeeRoute);
app.use("/api/dashboard", dashboardRoute);
app.use("/api/notifications", notifications);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use('/public', express.static(path.join(__dirname, 'public')));

io.on("connection", (socket) => {
  console.log("New client connected", socket.id);


  socket.on("disconnect", () => {
    console.log("Client disconnected", socket.id);
  });
});


server.listen(3001, () => {
  console.log("Server is running on port 3001");
});

export { io };

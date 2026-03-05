const { Server } = require("socket.io");

let io;

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    console.log("🔌 Socket.io Initialized");

    io.on("connection", (socket) => {
        console.log(`📡 New device connected: ${socket.id}`);

        socket.on("join-vehicle", (vehicleNumber) => {
            console.log(`🚛 Socket ${socket.id} joining room: ${vehicleNumber}`);
            socket.join(vehicleNumber);
        });

        socket.on("leave-vehicle", (vehicleNumber) => {
            console.log(`🚪 Socket ${socket.id} leaving room: ${vehicleNumber}`);
            socket.leave(vehicleNumber);
        });

        socket.on("disconnect", () => {
            console.log(`❌ Device disconnected: ${socket.id}`);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

const emitTelemetry = (vehicleNumber, data) => {
    if (io) {
        // console.log(`🚀 Emitting telemetry to room ${vehicleNumber}`);
        io.to(vehicleNumber).emit("telemetry-update", data);
    }
};

module.exports = { initSocket, getIO, emitTelemetry };

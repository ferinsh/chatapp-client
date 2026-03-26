import { io } from "socket.io-client";

const socket = io("https://chatapp-server-srpb.onrender.com", { autoConnect: false });
export default socket;
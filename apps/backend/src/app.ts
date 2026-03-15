import express from "express";
import cors from "cors";
import routes from "./routes";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./modules/auth/better-auth";

const app = express();

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(cors());
app.use(express.json());

app.use("/api/v1/", routes);

export default app;

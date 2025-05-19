import express from "express";
import { notificationController } from "../controllers/notificationController.js";

const notificationRouter = express.Router();

notificationRouter.post("/", notificationController.create);

export default notificationRouter;

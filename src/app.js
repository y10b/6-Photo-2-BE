import express from "express";
import { errorHandler } from "./middlewares/error.middleware.js";
import cors from "cors";
import photoRouter from "./routes/photoRoutes.js";
import shopRouter from "./routes/shopRoutes.js";
import purchaseRouter from "./routes/purchaseRoutes.js";

const app = express();
const PORT = 5005;

app.use(cors({ origin: "*" }));

app.use(express.json());

//라우터 등록
app.use("/", photoRouter);
app.use("/api", shopRouter);
app.use("/api/purchase", purchaseRouter)

//미들웨어
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`서버가 작동 중 입니다. 포트 번호: ${PORT}`);
});

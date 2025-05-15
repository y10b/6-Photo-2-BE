import express from "express"
import { errorHandler } from "./middlewares/error.middleware.js";

const app = express();
const PORT = 5000;

app.use(express.json())

//라우터 등록
// app.use('/user', userRouter)

//미들웨어
app.use(errorHandler)

app.listen(PORT, () => {
    console.log(`서버가 작동 중 입니다. 포트 번호: ${PORT}`)
})
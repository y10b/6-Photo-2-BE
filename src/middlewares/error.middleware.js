import { NotFoundError, BadRequestError, UnauthorizedError, ForbiddenError, InternalServerError } from '../utils/customError.js';

export const errorHandler = (err, req, res, next) => {
    console.error(err.stack); // 에러 스택을 콘솔에 출력

    // 각 에러 타입별로 처리
    if (err instanceof NotFoundError || err instanceof BadRequestError || err instanceof UnauthorizedError || err instanceof ForbiddenError || err instanceof InternalServerError) {
        return res.status(err.statusCode).json({
            success: false,
            error: err.message,
        });
    }

    // 예기치 않은 에러는 500으로 처리
    return res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: err.message
    });
};
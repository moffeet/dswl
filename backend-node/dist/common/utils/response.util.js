"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseUtil = void 0;
class ResponseUtil {
    static success(data, message = '操作成功') {
        return {
            code: 200,
            message,
            data,
            timestamp: new Date().toISOString(),
        };
    }
    static page(data, total, page, limit, message = '获取成功') {
        return {
            code: 200,
            message,
            data: {
                list: data,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
            timestamp: new Date().toISOString(),
        };
    }
    static error(message = '操作失败', code = 400) {
        return {
            code,
            message,
            data: null,
            timestamp: new Date().toISOString(),
        };
    }
}
exports.ResponseUtil = ResponseUtil;
//# sourceMappingURL=response.util.js.map
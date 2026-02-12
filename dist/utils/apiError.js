"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiError = apiError;
function apiError(res, status, message) {
    return res.status(status).json({ error: message });
}

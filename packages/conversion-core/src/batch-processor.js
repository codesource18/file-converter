"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.packageBatchToZip = packageBatchToZip;
const jszip_1 = __importDefault(require("jszip"));
async function packageBatchToZip(results, zipFilename = 'converted-files.zip') {
    const zip = new jszip_1.default();
    for (let i = 0; i < results.length; i++) {
        const res = results[i];
        if (res.blob) {
            zip.file(res.filename, res.blob);
        }
    }
    return await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
    });
}

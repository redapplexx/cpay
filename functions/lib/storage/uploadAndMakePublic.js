"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadAndMakePublic = uploadAndMakePublic;
const storage_1 = require("@google-cloud/storage");
const path_1 = __importDefault(require("path"));
const storage = new storage_1.Storage({
    projectId: 'redapplex-ai-platform',
    keyFilename: path_1.default.join(__dirname, '../../../redapplex-ai-platform-firebase-adminsdk-fbsvc-3f41372c29.json'),
});
const bucketName = 'redapplex-ai-platform.appspot.com';
const bucket = storage.bucket(bucketName);
async function uploadAndMakePublic(localFilePath, destFileName) {
    await bucket.upload(localFilePath, {
        destination: destFileName,
        public: true,
        metadata: {
            cacheControl: 'public, max-age=31536000',
        },
    });
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${destFileName}`;
    return publicUrl;
}
// Example usage (uncomment to test):
// uploadAndMakePublic('./logo.png', 'images/logo.png')
//   .then(url => console.log('Public URL:', url)); 
//# sourceMappingURL=uploadAndMakePublic.js.map
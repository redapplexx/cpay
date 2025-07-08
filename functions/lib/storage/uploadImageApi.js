"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const admin_1 = require("../admin");
const router = express_1.default.Router();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
router.post('/upload-image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }
        const bucket = admin_1.admin.storage().bucket();
        const fileName = `images/${Date.now()}_${req.file.originalname}`;
        await bucket.file(fileName).save(req.file.buffer, {
            metadata: {
                contentType: req.file.mimetype,
            },
        });
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
        return res.json({ url: publicUrl });
    }
    catch (error) {
        console.error('Upload error:', error);
        return res.status(500).json({ error: 'Failed to upload image' });
    }
});
exports.default = router;
//# sourceMappingURL=uploadImageApi.js.map
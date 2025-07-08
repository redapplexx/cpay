import { Storage } from '@google-cloud/storage';
import path from 'path';

const storage = new Storage({
  projectId: 'redapplex-ai-platform',
  keyFilename: path.join(__dirname, '../../../redapplex-ai-platform-firebase-adminsdk-fbsvc-3f41372c29.json'),
});

const bucketName = 'redapplex-ai-platform.appspot.com';
const bucket = storage.bucket(bucketName);

export async function uploadAndMakePublic(localFilePath: string, destFileName: string): Promise<string> {
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
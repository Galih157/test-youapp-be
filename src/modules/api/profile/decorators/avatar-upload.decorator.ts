import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

export function AvatarUpload() {
  return applyDecorators(
    UseInterceptors(
      FileInterceptor('avatar', {
        storage: memoryStorage(),
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (_req, file, cb) => {
          const allowed = ['image/jpeg', 'image/png', 'image/webp'];
          if (!allowed.includes(file.mimetype)) {
            return cb(new Error('Only JPEG, PNG, and WebP images are allowed'), false);
          }
          cb(null, true);
        },
      }),
    ),
  );
}

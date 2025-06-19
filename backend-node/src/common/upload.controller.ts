import { 
  Controller, 
  Post, 
  UseInterceptors, 
  UploadedFile, 
  UploadedFiles,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

// 配置文件存储
const storage = diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = join(process.cwd(), 'uploads');
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + extname(file.originalname));
  },
});

// 文件过滤器
const imageFilter = (req, file, cb) => {
  if (file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
    cb(null, true);
  } else {
    cb(new BadRequestException('只允许上传图片文件'), false);
  }
};

@ApiTags('文件上传')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('upload')
export class UploadController {

  @ApiOperation({ summary: '上传单个图片' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: '上传成功' })
  @Post('image')
  @UseInterceptors(FileInterceptor('file', {
    storage,
    fileFilter: imageFilter,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
  }))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('请选择要上传的文件');
    }

    return {
      message: '文件上传成功',
      filename: file.filename,
      originalname: file.originalname,
      size: file.size,
      url: `/uploads/${file.filename}`,
    };
  }

  @ApiOperation({ summary: '上传多个图片' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: '上传成功' })
  @Post('images')
  @UseInterceptors(FilesInterceptor('files', 5, {
    storage,
    fileFilter: imageFilter,
    limits: {
      fileSize: 5 * 1024 * 1024, // 每个文件5MB
    },
  }))
  async uploadImages(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('请选择要上传的文件');
    }

    const uploadedFiles = files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      size: file.size,
      url: `/uploads/${file.filename}`,
    }));

    return {
      message: '文件上传成功',
      count: files.length,
      files: uploadedFiles,
    };
  }
} 
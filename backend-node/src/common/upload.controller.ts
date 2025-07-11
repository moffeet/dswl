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
import { extname } from 'path';
import { UploadConfig } from '../config/upload.config';
import { ResponseUtil } from './utils/response.util';

// 配置文件存储
const storage = diskStorage({
  destination: (req, file, cb) => {
    try {
      const uploadDir = UploadConfig.getUploadRootPath();
      const actualUploadDir = UploadConfig.ensureDirectoryExists(uploadDir);
      cb(null, actualUploadDir);
    } catch (error) {
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    const fileName = UploadConfig.generateUniqueFileName(file.originalname, file.fieldname);
    cb(null, fileName);
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

    const relativePath = UploadConfig.getRelativePath(file.path);
    return ResponseUtil.success({
      filename: file.filename,
      originalname: file.originalname,
      size: file.size,
      url: UploadConfig.getUrlPath(relativePath),
    }, '文件上传成功');
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

    const uploadedFiles = files.map(file => {
      const relativePath = UploadConfig.getRelativePath(file.path);
      return {
        filename: file.filename,
        originalname: file.originalname,
        size: file.size,
        url: UploadConfig.getUrlPath(relativePath),
      };
    });

    return ResponseUtil.success({
      count: files.length,
      files: uploadedFiles,
    }, '文件上传成功');
  }
} 
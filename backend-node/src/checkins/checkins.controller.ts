import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  Req,
  BadRequestException
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
  ApiConsumes,
  ApiQuery
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { CheckinsService } from './checkins.service';
import { UploadCheckinDto, UploadCheckinResponseDto } from './dto/upload-checkin.dto';
import { CheckinQueryDto, CheckinListResponseDto } from './dto/checkin-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { RESPONSE_CODES } from '../common/constants/response-codes';
import { CustomLogger } from '../config/logger.config';

@ApiTags('📍 打卡管理')
@Controller('checkins')
export class CheckinsController {
  private readonly logger = new CustomLogger('CheckinsController');

  constructor(private readonly checkinsService: CheckinsService) {}

  @Public()
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
      files: 1, // 限制文件数量
    },
    fileFilter: (req, file, callback) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
        return callback(new BadRequestException('只支持图片格式：jpg, jpeg, png, gif'), false);
      }
      callback(null, true);
    },
  }))
  @ApiOperation({
    summary: '小程序上传打卡',
    description: '小程序用户上传打卡图片和相关信息'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: '上传打卡数据',
    type: UploadCheckinDto
  })
  @ApiResponse({
    status: 200,
    description: '打卡成功',
    type: UploadCheckinResponseDto
  })
  @ApiResponse({ status: 400, description: '参数错误' })
  async uploadCheckin(
    @Body() uploadDto: UploadCheckinDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request
  ) {
    const startTime = Date.now();
    try {
      this.logger.log(`开始上传打卡 - 用户: ${uploadDto.wxUserName}, 文件大小: ${file?.size || 0} bytes`);

      if (!file) {
        throw new BadRequestException('请上传打卡图片');
      }

      // 检查文件大小
      if (file.size > 10 * 1024 * 1024) {
        throw new BadRequestException('文件大小不能超过10MB');
      }

      // 构建基础URL
      const protocol = req.protocol;
      const host = req.get('host');
      const baseUrl = `${protocol}://${host}`;

      this.logger.log(`开始处理文件 - 文件名: ${file.originalname}, 大小: ${file.size}`);
      
      const checkin = await this.checkinsService.uploadCheckin(uploadDto, file, baseUrl);

      const duration = Date.now() - startTime;
      this.logger.log(`打卡上传成功 - 耗时: ${duration}ms, ID: ${checkin.id}`);

      return {
        code: RESPONSE_CODES.SUCCESS,
        message: '打卡成功',
        data: {
          id: checkin.id,
          imageUrl: checkin.imageUrl,
          checkinTime: checkin.checkinTime,
          wxUserName: checkin.wxUserName,
          customerName: checkin.customerName,
          checkinLocation: checkin.checkinLocation
        }
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`上传打卡失败 - 耗时: ${duration}ms, 错误: ${error.message}`, error.stack);
      
      // 检查是否是网络连接问题
      if (error.message.includes('aborted') || error.code === 'ECONNRESET') {
        this.logger.error('检测到网络连接中断，可能是客户端提前关闭连接');
        return {
          code: RESPONSE_CODES.SERVER_ERROR,
          message: '网络连接中断，请重试',
          data: null
        };
      }
      
      return {
        code: error.status === 400 ? RESPONSE_CODES.PARAM_ERROR :
              RESPONSE_CODES.SERVER_ERROR,
        message: error.message,
        data: null
      };
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '获取打卡列表',
    description: '获取打卡列表，支持搜索、时间范围查询、排序和分页功能'
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: '页码',
    example: 1
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '每页数量',
    example: 10
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: '搜索关键词（打卡人姓名）',
    example: '张三'
  })
  @ApiQuery({
    name: 'customerName',
    required: false,
    description: '客户名称搜索',
    example: '深圳科技'
  })
  @ApiQuery({
    name: 'startTime',
    required: false,
    description: '开始时间',
    example: '2025-01-01T00:00:00.000Z'
  })
  @ApiQuery({
    name: 'endTime',
    required: false,
    description: '结束时间',
    example: '2025-01-31T23:59:59.999Z'
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: '排序字段',
    example: 'checkinTime'
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description: '排序方向',
    example: 'DESC'
  })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    type: CheckinListResponseDto
  })
  async findAll(@Query() queryDto: CheckinQueryDto) {
    try {
      this.logger.log(`获取打卡列表 - 参数: ${JSON.stringify(queryDto)}`);

      const { checkins, total, page, limit } = await this.checkinsService.findAll(queryDto);

      return {
        code: RESPONSE_CODES.SUCCESS,
        message: '获取成功',
        data: {
          list: checkins,
          total,
          page,
          limit
        }
      };
    } catch (error) {
      this.logger.error(`获取打卡列表失败: ${error.message}`, error.stack);
      return {
        code: RESPONSE_CODES.SERVER_ERROR,
        message: error.message,
        data: null
      };
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '获取打卡详情',
    description: '根据ID获取打卡详细信息'
  })
  @ApiParam({
    name: 'id',
    description: '打卡ID',
    example: 1
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '打卡记录不存在' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    try {
      this.logger.log(`获取打卡详情 - ID: ${id}`);

      const checkin = await this.checkinsService.findOne(id);

      return {
        code: RESPONSE_CODES.SUCCESS,
        message: '获取成功',
        data: checkin
      };
    } catch (error) {
      this.logger.error(`获取打卡详情失败: ${error.message}`, error.stack);
      return {
        code: error.status === 404 ? RESPONSE_CODES.PARAM_ERROR :
              error.status === 400 ? RESPONSE_CODES.PARAM_ERROR :
              RESPONSE_CODES.SERVER_ERROR,
        message: error.message,
        data: null
      };
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '删除打卡记录',
    description: '根据ID删除打卡记录（软删除）'
  })
  @ApiParam({
    name: 'id',
    description: '打卡ID',
    example: 1
  })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '打卡记录不存在' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    try {
      this.logger.log(`删除打卡记录 - ID: ${id}`);

      await this.checkinsService.remove(id);

      return {
        code: RESPONSE_CODES.SUCCESS,
        message: '删除成功',
        data: null
      };
    } catch (error) {
      this.logger.error(`删除打卡记录失败: ${error.message}`, error.stack);
      return {
        code: error.status === 404 ? RESPONSE_CODES.PARAM_ERROR :
              error.status === 400 ? RESPONSE_CODES.PARAM_ERROR :
              RESPONSE_CODES.SERVER_ERROR,
        message: error.message,
        data: null
      };
    }
  }

  @Delete('batch/remove')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '批量删除打卡记录',
    description: '批量删除多个打卡记录（软删除）'
  })
  @ApiBody({
    description: '要删除的打卡记录ID列表',
    schema: {
      type: 'object',
      properties: {
        ids: {
          type: 'array',
          items: { type: 'number' },
          example: [1, 2, 3]
        }
      }
    }
  })
  @ApiResponse({ status: 200, description: '批量删除成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  async batchRemove(@Body() body: { ids: number[] }) {
    try {
      this.logger.log(`批量删除打卡记录 - IDs: ${JSON.stringify(body.ids)}`);

      const result = await this.checkinsService.batchRemove(body.ids);

      return {
        code: RESPONSE_CODES.SUCCESS,
        message: `批量删除成功，共删除 ${result.deletedCount} 条记录`,
        data: result
      };
    } catch (error) {
      this.logger.error(`批量删除打卡记录失败: ${error.message}`, error.stack);
      return {
        code: error.status === 400 ? RESPONSE_CODES.PARAM_ERROR : RESPONSE_CODES.SERVER_ERROR,
        message: error.message,
        data: null
      };
    }
  }

  @Post('cleanup/old')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '清理3个月前的打卡记录',
    description: '定时清理3个月前的打卡记录和图片文件（硬删除）'
  })
  @ApiResponse({ status: 200, description: '清理成功' })
  async cleanupOldCheckins() {
    try {
      this.logger.log('开始清理3个月前的打卡记录');

      const result = await this.checkinsService.cleanupOldCheckins();

      return {
        code: RESPONSE_CODES.SUCCESS,
        message: `清理完成，共删除 ${result.deletedCount} 条记录`,
        data: result
      };
    } catch (error) {
      this.logger.error(`清理打卡记录失败: ${error.message}`, error.stack);
      return {
        code: RESPONSE_CODES.SERVER_ERROR,
        message: error.message,
        data: null
      };
    }
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery
} from '@nestjs/swagger';
import { WxUsersService } from './wx-users.service';
import { CreateWxUserDto } from './dto/create-wx-user.dto';
import { UpdateWxUserDto } from './dto/update-wx-user.dto';
import { WxUserQueryDto } from './dto/wx-user-query.dto';
import { WxLoginDto, WxLoginResponseDto, WxPhoneLoginDto } from './dto/wx-login.dto';
import { RESPONSE_CODES, HTTP_STATUS_CODES } from '../common/constants/response-codes';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChineseTime, RelativeTime } from '../common/decorators/format-time.decorator';
import { JwtService } from '@nestjs/jwt';
import { ResponseUtil } from '../common/utils/response.util';
import { WechatApiService } from './services/wechat-api.service';

@ApiTags('📱 小程序用户管理')
@Controller('wx-users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WxUsersController {
  constructor(
    private readonly wxUsersService: WxUsersService,
    private readonly jwtService: JwtService,
    private readonly wechatApiService: WechatApiService,
  ) {}

  @Public()
  @Post('login')
  @ApiOperation({
    summary: '小程序用户登录',
    description: '小程序传入微信openid和手机号进行登录，自动绑定用户并验证MAC地址'
  })
  @ApiResponse({
    status: HTTP_STATUS_CODES.OK,
    description: '登录成功',
    type: WxLoginResponseDto
  })
  @ApiResponse({ status: HTTP_STATUS_CODES.BAD_REQUEST, description: '登录失败' })
  @ApiResponse({ status: HTTP_STATUS_CODES.UNAUTHORIZED, description: 'MAC地址验证失败' })
  @ApiResponse({ status: HTTP_STATUS_CODES.NOT_FOUND, description: '用户不存在' })
  async login(@Body() loginDto: WxLoginDto) {
    try {
      // 1. 根据手机号查找用户
      let user = await this.wxUsersService.findByPhone(loginDto.phone);

      if (!user) {
        return {
          code: HTTP_STATUS_CODES.NOT_FOUND,
          message: '用户不存在，请联系管理员创建账户',
          data: null
        };
      }

      // 2. 更新用户的微信ID（如果还没有绑定）
      if (!user.wechatId) {
        await this.wxUsersService.updateWechatInfo(user.id, loginDto.wechatId, loginDto.macAddress);
        user = await this.wxUsersService.findOne(user.id); // 重新获取更新后的用户信息
      } else {
        // 如果已经绑定了微信ID，验证是否匹配
        if (user.wechatId !== loginDto.wechatId) {
          return {
            code: HTTP_STATUS_CODES.BAD_REQUEST,
            message: '微信账号不匹配，请使用正确的微信账号登录',
            data: null
          };
        }
      }

      // 3. 验证MAC地址
      if (loginDto.macAddress) {
        const macValid = await this.wxUsersService.validateMacAddress(user.id, loginDto.macAddress);
        if (!macValid) {
          return {
            code: HTTP_STATUS_CODES.UNAUTHORIZED,
            message: 'MAC地址验证失败，请使用注册设备登录',
            data: null
          };
        }
      }

      // 4. 生成JWT token
      const payload = {
        sub: user.id,
        username: user.name,
        phone: user.phone,
        role: user.role,
        userType: 'wx-user'
      };

      const accessToken = this.jwtService.sign(payload);

      return {
        code: RESPONSE_CODES.SUCCESS,
        message: '登录成功',
        data: {
          accessToken,
          user: {
            id: user.id,
            name: user.name,
            phone: user.phone,
            role: user.role,
            wechatId: user.wechatId
          }
        }
      };

    } catch (error) {
      return {
        code: HTTP_STATUS_CODES.BAD_REQUEST,
        message: error.message || '登录失败',
        data: null
      };
    }
  }

  @Public()
  @Post('login-with-phone')
  @ApiOperation({
    summary: '微信授权手机号登录',
    description: '通过微信授权获取手机号进行登录，自动创建或绑定用户账户'
  })
  @ApiResponse({
    status: HTTP_STATUS_CODES.OK,
    description: '登录成功',
    type: WxLoginResponseDto
  })
  @ApiResponse({ status: HTTP_STATUS_CODES.BAD_REQUEST, description: '登录失败' })
  @ApiResponse({ status: HTTP_STATUS_CODES.UNAUTHORIZED, description: 'MAC地址验证失败' })
  async loginWithPhone(@Body() loginDto: WxPhoneLoginDto) {
    try {
      // 1. 通过jsCode获取openid
      const sessionInfo = await this.wechatApiService.getSessionInfo(loginDto.jsCode);
      if (!sessionInfo.openid) {
        return {
          code: HTTP_STATUS_CODES.BAD_REQUEST,
          message: '获取微信用户信息失败',
          data: null
        };
      }

      // 2. 通过code获取手机号
      const phoneNumber = await this.wechatApiService.getPhoneNumber(loginDto.code);

      // 3. 根据手机号查找用户
      let user = await this.wxUsersService.findByPhone(phoneNumber);

      if (!user) {
        return {
          code: HTTP_STATUS_CODES.NOT_FOUND,
          message: '用户不存在，请联系管理员创建账户',
          data: null
        };
      }

      // 4. 更新用户的微信ID（如果还没有绑定）
      if (!user.wechatId) {
        await this.wxUsersService.updateWechatInfo(user.id, sessionInfo.openid, loginDto.macAddress);
        user = await this.wxUsersService.findOne(user.id); // 重新获取更新后的用户信息
      } else {
        // 如果已经绑定了微信ID，验证是否匹配
        if (user.wechatId !== sessionInfo.openid) {
          return {
            code: HTTP_STATUS_CODES.BAD_REQUEST,
            message: '微信账号不匹配，请使用正确的微信账号登录',
            data: null
          };
        }
      }

      // 5. 验证MAC地址
      if (loginDto.macAddress) {
        const macValid = await this.wxUsersService.validateMacAddress(user.id, loginDto.macAddress);
        if (!macValid) {
          return {
            code: HTTP_STATUS_CODES.UNAUTHORIZED,
            message: 'MAC地址验证失败，请使用注册设备登录',
            data: null
          };
        }
      }

      // 6. 生成JWT token
      const payload = {
        sub: user.id,
        username: user.name,
        phone: user.phone,
        role: user.role,
        userType: 'wx-user'
      };

      const accessToken = this.jwtService.sign(payload);

      return {
        code: RESPONSE_CODES.SUCCESS,
        message: '登录成功',
        data: {
          accessToken,
          user: {
            id: user.id,
            name: user.name,
            phone: user.phone,
            role: user.role,
            wechatId: user.wechatId
          }
        }
      };

    } catch (error) {
      return {
        code: HTTP_STATUS_CODES.BAD_REQUEST,
        message: error.message || '登录失败',
        data: null
      };
    }
  }

  @Post()
  @ChineseTime() // 创建小程序用户时间格式化
  @ApiOperation({
    summary: '创建小程序用户',
    description: '创建新的小程序用户，手机号必须唯一。角色只能是司机或销售。'
  })
  @ApiResponse({
    status: HTTP_STATUS_CODES.OK,
    description: '创建成功',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        message: { type: 'string', example: '创建成功' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: '张三' },
            phone: { type: 'string', example: '13800138001' },
            role: { type: 'string', example: '司机' },
            wechatId: { type: 'string', example: 'wx_zhangsan' },
            macAddress: { type: 'string', example: '00:11:22:33:44:55' },
            createTime: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
            updateTime: { type: 'string', example: '2024-01-01T00:00:00.000Z' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: HTTP_STATUS_CODES.BAD_REQUEST, description: '请求参数错误' })
  @ApiResponse({ status: HTTP_STATUS_CODES.CONFLICT, description: '手机号已存在' })
  async create(@Body() createWxUserDto: CreateWxUserDto) {
    const wxUser = await this.wxUsersService.create(createWxUserDto);
    return {
      code: RESPONSE_CODES.SUCCESS,
      message: '创建成功',
      data: wxUser
    };
  }

  @Get()
  @ChineseTime() // 小程序用户列表时间格式化
  @ApiOperation({
    summary: '获取小程序用户列表',
    description: '分页查询小程序用户列表，支持按姓名、手机号、角色、微信ID进行筛选。'
  })
  @ApiQuery({ name: 'page', required: false, description: '页码', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量', example: 10 })
  @ApiQuery({ name: 'name', required: false, description: '姓名搜索', example: '张三' })
  @ApiQuery({ name: 'phone', required: false, description: '手机号搜索', example: '138' })
  @ApiQuery({ name: 'role', required: false, description: '角色筛选', example: '司机' })
  @ApiQuery({ name: 'wechatId', required: false, description: '微信ID搜索', example: 'wx_' })
  @ApiResponse({
    status: HTTP_STATUS_CODES.OK,
    description: '获取成功',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        message: { type: 'string', example: '获取成功' },
        data: {
          type: 'object',
          properties: {
            list: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  name: { type: 'string', example: '张三' },
                  phone: { type: 'string', example: '13800138001' },
                  role: { type: 'string', example: '司机' },
                  wechatId: { type: 'string', example: 'wx_zhangsan' },
                  macAddress: { type: 'string', example: '00:11:22:33:44:55' },
                  createTime: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
                  updateTime: { type: 'string', example: '2024-01-01T00:00:00.000Z' }
                }
              }
            },
            total: { type: 'number', example: 100 },
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 }
          }
        }
      }
    }
  })
  async findAll(@Query() queryDto: WxUserQueryDto) {
    const { wxUsers, total } = await this.wxUsersService.findAll(queryDto);
    return ResponseUtil.page(
      wxUsers,
      total,
      queryDto.page || 1,
      queryDto.limit || 10,
      '获取成功'
    );
  }

  @Get(':id')
  @ChineseTime() // 小程序用户详情时间格式化
  @ApiOperation({ summary: '获取小程序用户详情' })
  @ApiParam({ name: 'id', description: '用户ID', example: 1 })
  @ApiResponse({ status: HTTP_STATUS_CODES.OK, description: '获取成功' })
  @ApiResponse({ status: HTTP_STATUS_CODES.NOT_FOUND, description: '用户不存在' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const wxUser = await this.wxUsersService.findOne(id);
    return {
      code: RESPONSE_CODES.SUCCESS,
      message: '获取成功',
      data: wxUser
    };
  }

  @Patch(':id')
  @ChineseTime() // 更新小程序用户时间格式化
  @ApiOperation({ summary: '更新小程序用户' })
  @ApiParam({ name: 'id', description: '用户ID', example: 1 })
  @ApiResponse({ status: HTTP_STATUS_CODES.OK, description: '更新成功' })
  @ApiResponse({ status: HTTP_STATUS_CODES.NOT_FOUND, description: '用户不存在' })
  @ApiResponse({ status: HTTP_STATUS_CODES.CONFLICT, description: '手机号已存在' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateWxUserDto: UpdateWxUserDto,
  ) {
    const wxUser = await this.wxUsersService.update(id, updateWxUserDto);
    return {
      code: RESPONSE_CODES.SUCCESS,
      message: '更新成功',
      data: wxUser
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除小程序用户' })
  @ApiParam({ name: 'id', description: '用户ID', example: 1 })
  @ApiResponse({ status: HTTP_STATUS_CODES.OK, description: '删除成功' })
  @ApiResponse({ status: HTTP_STATUS_CODES.NOT_FOUND, description: '用户不存在' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.wxUsersService.remove(id);
    return {
      code: RESPONSE_CODES.SUCCESS,
      message: '删除成功'
    };
  }
}

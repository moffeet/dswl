import { Controller, Get, Post, Body, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

class TestDto {
  @IsString({ message: '名称必须是字符串' })
  @IsNotEmpty({ message: '名称不能为空' })
  name: string;
}

/**
 * 异常测试控制器
 * 仅用于开发环境测试全局异常过滤器
 * 生产环境应该移除此控制器
 */
@ApiTags('🧪 异常测试 (仅开发环境)')
@Controller('test-exception')
export class TestExceptionController {

  @ApiOperation({ 
    summary: '测试参数验证异常',
    description: '测试class-validator验证失败时的异常处理'
  })
  @ApiResponse({ status: 400, description: '参数验证失败' })
  @Post('validation-error')
  testValidationError(@Body() testDto: TestDto) {
    return { message: '如果看到这个消息，说明验证通过了', data: testDto };
  }

  @ApiOperation({ 
    summary: '测试业务异常',
    description: '测试手动抛出的业务异常处理'
  })
  @ApiResponse({ status: 400, description: '业务异常' })
  @Get('business-error')
  testBusinessError() {
    throw new BadRequestException('这是一个测试的业务异常');
  }

  @ApiOperation({ 
    summary: '测试404异常',
    description: '测试资源不存在异常处理'
  })
  @ApiResponse({ status: 404, description: '资源不存在' })
  @Get('not-found-error')
  testNotFoundError() {
    throw new NotFoundException('测试资源不存在');
  }

  @ApiOperation({ 
    summary: '测试服务器异常',
    description: '测试服务器内部错误异常处理'
  })
  @ApiResponse({ status: 500, description: '服务器内部错误' })
  @Get('server-error')
  testServerError() {
    throw new InternalServerErrorException('这是一个测试的服务器异常');
  }

  @ApiOperation({ 
    summary: '测试未捕获异常',
    description: '测试未被明确捕获的异常处理'
  })
  @ApiResponse({ status: 500, description: '服务器内部错误' })
  @Get('uncaught-error')
  testUncaughtError() {
    // 故意抛出一个未被明确处理的异常
    throw new Error('这是一个未被捕获的测试异常');
  }

  @ApiOperation({ 
    summary: '测试数据库异常',
    description: '模拟数据库错误异常处理'
  })
  @ApiResponse({ status: 400, description: '数据库错误' })
  @Get('database-error')
  testDatabaseError() {
    // 模拟数据库错误
    const error = new Error('Duplicate entry for key PRIMARY');
    (error as any).code = 'ER_DUP_ENTRY';
    (error as any).errno = 1062;
    throw error;
  }

  @ApiOperation({ 
    summary: '测试文件系统异常',
    description: '模拟文件系统错误异常处理'
  })
  @ApiResponse({ status: 500, description: '文件系统错误' })
  @Get('filesystem-error')
  testFileSystemError() {
    // 模拟文件系统错误
    const error = new Error('File not found');
    (error as any).code = 'ENOENT';
    throw error;
  }

  @ApiOperation({ 
    summary: '测试正常响应',
    description: '测试正常情况下的响应格式'
  })
  @ApiResponse({ status: 200, description: '成功' })
  @Get('success')
  testSuccess() {
    return {
      code: 200,
      message: '测试成功',
      data: {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
      },
    };
  }
}

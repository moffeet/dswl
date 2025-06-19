import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { SearchCustomerDto } from './dto/search-customer.dto';
import { Customer } from './entities/customer.entity';

@ApiTags('客户管理')
@Controller('api/customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @ApiOperation({ summary: '获取客户列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Get()
  async findAll(@Query('page') page = 1, @Query('limit') limit = 10) {
    try {
      const result = await this.customersService.findAll(
        parseInt(page.toString()),
        parseInt(limit.toString())
      );
      
      return {
        code: 0,
        message: '获取成功',
        data: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
      };
    } catch (error) {
      return {
        code: 500,
        message: '获取失败',
        data: null,
        error: error.message,
      };
    }
  }

  @ApiOperation({ summary: '搜索客户' })
  @ApiResponse({ status: 200, description: '搜索成功' })
  @Get('search')
  async search(@Query() query: SearchCustomerDto) {
    try {
      const result = await this.customersService.search(query);
      
      return {
        code: 0,
        message: '搜索成功',
        data: result.data,
        total: result.total,
      };
    } catch (error) {
      return {
        code: 500,
        message: '搜索失败',
        data: null,
        error: error.message,
      };
    }
  }

  @ApiOperation({ summary: '获取客户详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const customer = await this.customersService.findOne(parseInt(id));
      
      if (!customer) {
        return {
          code: 404,
          message: '客户不存在',
          data: null,
        };
      }
      
      return {
        code: 0,
        message: '获取成功',
        data: customer,
      };
    } catch (error) {
      return {
        code: 500,
        message: '获取失败',
        data: null,
        error: error.message,
      };
    }
  }

  @ApiOperation({ summary: '创建客户' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @Post()
  async create(@Body() createCustomerDto: CreateCustomerDto) {
    try {
      const customer = await this.customersService.create(createCustomerDto);
      
      return {
        code: 0,
        message: '创建成功',
        data: customer,
      };
    } catch (error) {
      return {
        code: 500,
        message: '创建失败',
        data: null,
        error: error.message,
      };
    }
  }

  @ApiOperation({ summary: '更新客户' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateCustomerDto: UpdateCustomerDto) {
    try {
      const customer = await this.customersService.update(parseInt(id), updateCustomerDto);
      
      if (!customer) {
        return {
          code: 404,
          message: '客户不存在',
          data: null,
        };
      }
      
      return {
        code: 0,
        message: '更新成功',
        data: customer,
      };
    } catch (error) {
      return {
        code: 500,
        message: '更新失败',
        data: null,
        error: error.message,
      };
    }
  }

  @ApiOperation({ summary: '删除客户' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      const customer = await this.customersService.remove(parseInt(id));
      
      if (!customer) {
        return {
          code: 404,
          message: '客户不存在',
          data: null,
        };
      }
      
      return {
        code: 0,
        message: '删除成功',
        data: customer,
      };
    } catch (error) {
      return {
        code: 500,
        message: '删除失败',
        data: null,
        error: error.message,
      };
    }
  }
} 
import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { SearchCustomerDto } from './dto/search-customer.dto';
import { Customer } from './entities/customer.entity';

@ApiTags('客户管理')
@Controller('api/customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @ApiOperation({ 
    summary: '获取客户列表',
    description: '分页获取客户列表，支持页码和每页数量控制'
  })
  @ApiQuery({ name: 'page', required: false, description: '页码，默认为1', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量，默认为10', example: 10 })
  @ApiResponse({ 
    status: 200, 
    description: '获取成功',
    schema: {
      example: {
        code: 0,
        message: '获取成功',
        data: [
          {
            id: 1,
            customerNumber: 'C001',
            customerName: '北京华领科技有限公司',
            customerAddress: '北京市朝阳区建国门外大街123号',
            updateTime: '2024-01-15T10:30:00.000Z',
            updateBy: '系统'
          }
        ],
        total: 1,
        page: 1,
        limit: 10
      }
    }
  })
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

  @ApiOperation({ 
    summary: '创建客户',
    description: '创建新客户，客户编号将自动生成（格式：C001、C002...）'
  })
  @ApiBody({
    type: CreateCustomerDto,
    description: '客户创建信息',
    examples: {
      example1: {
        summary: '创建客户示例',
        value: {
          customerName: '李果果公司',
          customerAddress: '广州市天河北28号'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: '创建成功',
    schema: {
      example: {
        code: 0,
        message: '创建成功',
        data: {
          id: 8,
          customerNumber: 'C008',
          customerName: '李果果公司',
          customerAddress: '广州市天河北28号',
          updateTime: '2024-01-15T10:30:00.000Z',
          updateBy: '管理员'
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 500, description: '服务器内部错误' })
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

  @ApiOperation({ 
    summary: '删除客户',
    description: '根据客户ID删除客户信息，删除后无法恢复'
  })
  @ApiParam({ name: 'id', description: '客户ID', example: 1 })
  @ApiResponse({ 
    status: 200, 
    description: '删除成功',
    schema: {
      example: {
        code: 0,
        message: '删除成功',
        data: {
          id: 1,
          customerNumber: 'C001',
          customerName: '已删除的客户'
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: '客户不存在' })
  @ApiResponse({ status: 500, description: '删除失败' })
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
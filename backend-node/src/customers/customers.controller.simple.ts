import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

// 模拟客户数据
const mockCustomers = [
  {
    id: 1,
    customerNumber: 'C001',
    customerName: '北京华强科技有限公司',
    customerAddress: '北京市朝阳区建国路88号',
    contactPerson: '张经理',
    contactPhone: '13800138001',
    area: '华北',
    status: 'active',
    latitude: 39.9042,
    longitude: 116.4074,
    createTime: '2024-01-15T08:30:00Z',
  },
  {
    id: 2,
    customerNumber: 'C002',
    customerName: '上海创新物流集团',
    customerAddress: '上海市浦东新区世纪大道1000号',
    contactPerson: '李总',
    contactPhone: '13800138002',
    area: '华东',
    status: 'active',
    latitude: 31.2304,
    longitude: 121.4737,
    createTime: '2024-02-20T09:15:00Z',
  },
  {
    id: 3,
    customerNumber: 'C003',
    customerName: '深圳智慧供应链公司',
    customerAddress: '深圳市南山区科技园南路35号',
    contactPerson: '王主任',
    contactPhone: '13800138003',
    area: '华南',
    status: 'active',
    latitude: 22.5431,
    longitude: 114.0579,
    createTime: '2024-03-10T10:45:00Z',
  },
];

@ApiTags('客户管理')
@Controller('api/customers')
export class CustomersController {

  @ApiOperation({ summary: '获取客户列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Get()
  findAll(@Query('page') page = 1, @Query('limit') limit = 10) {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit.toString());
    const data = mockCustomers.slice(startIndex, endIndex);
    
    return {
      code: 0,
      message: '获取成功',
      data,
      total: mockCustomers.length,
      page: parseInt(page.toString()),
      limit: parseInt(limit.toString()),
    };
  }

  @ApiOperation({ summary: '搜索客户' })
  @ApiResponse({ status: 200, description: '搜索成功' })
  @Get('search')
  search(@Query() query: any) {
    let results = [...mockCustomers];
    
    if (query.customerNumber) {
      results = results.filter(c => c.customerNumber.includes(query.customerNumber));
    }
    if (query.customerName) {
      results = results.filter(c => c.customerName.includes(query.customerName));
    }
    if (query.customerAddress) {
      results = results.filter(c => c.customerAddress.includes(query.customerAddress));
    }
    if (query.area) {
      results = results.filter(c => c.area === query.area);
    }
    
    return {
      code: 0,
      message: '搜索成功',
      data: results,
      total: results.length,
    };
  }

  @ApiOperation({ summary: '获取客户详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    const customer = mockCustomers.find(c => c.id === parseInt(id));
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
  }

  @ApiOperation({ summary: '创建客户' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @Post()
  create(@Body() createCustomerDto: any) {
    const newCustomer = {
      id: mockCustomers.length + 1,
      customerNumber: `C${String(mockCustomers.length + 1).padStart(3, '0')}`,
      ...createCustomerDto,
      createTime: new Date().toISOString(),
    };
    
    mockCustomers.push(newCustomer);
    
    return {
      code: 0,
      message: '创建成功',
      data: newCustomer,
    };
  }

  @ApiOperation({ summary: '更新客户' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCustomerDto: any) {
    const index = mockCustomers.findIndex(c => c.id === parseInt(id));
    if (index === -1) {
      return {
        code: 404,
        message: '客户不存在',
        data: null,
      };
    }
    
    mockCustomers[index] = { ...mockCustomers[index], ...updateCustomerDto };
    
    return {
      code: 0,
      message: '更新成功',
      data: mockCustomers[index],
    };
  }

  @ApiOperation({ summary: '删除客户' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    const index = mockCustomers.findIndex(c => c.id === parseInt(id));
    if (index === -1) {
      return {
        code: 404,
        message: '客户不存在',
        data: null,
      };
    }
    
    const deletedCustomer = mockCustomers.splice(index, 1)[0];
    
    return {
      code: 0,
      message: '删除成功',
      data: deletedCustomer,
    };
  }
} 
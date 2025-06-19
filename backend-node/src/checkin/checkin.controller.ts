import { Controller, Get, Post, Body, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CheckinService } from './checkin.service';
import { CreateCheckinDto } from './dto/create-checkin.dto';
import { SearchCheckinDto } from './dto/search-checkin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CheckinRecord } from './entities/checkin-record.entity';

@ApiTags('打卡管理')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('checkin')
export class CheckinController {
  constructor(private readonly checkinService: CheckinService) {}

  @ApiOperation({ summary: '创建打卡记录' })
  @ApiResponse({ status: 201, description: '打卡成功', type: CheckinRecord })
  @Post()
  async create(@Body() createCheckinDto: CreateCheckinDto, @Request() req): Promise<CheckinRecord> {
    return this.checkinService.create(createCheckinDto, req.user.id);
  }

  @ApiOperation({ summary: '获取打卡记录列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Get()
  async findAll(@Query() searchDto: SearchCheckinDto) {
    return this.checkinService.findAll(searchDto);
  }

  @ApiOperation({ summary: '获取我的打卡记录' })
  @ApiResponse({ status: 200, description: '获取成功', type: [CheckinRecord] })
  @Get('my')
  async getMyCheckins(@Request() req, @Query('limit') limit: number = 20): Promise<CheckinRecord[]> {
    return this.checkinService.findByDriver(req.user.id, limit);
  }

  @ApiOperation({ summary: '获取今日打卡记录' })
  @ApiResponse({ status: 200, description: '获取成功', type: [CheckinRecord] })
  @Get('today')
  async getTodayCheckins(@Request() req): Promise<CheckinRecord[]> {
    return this.checkinService.getTodayCheckins(req.user.id);
  }

  @ApiOperation({ summary: '获取打卡统计' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Get('stats')
  async getStats(
    @Query('driverId') driverId?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.checkinService.getCheckinStats(driverId, startDate, endDate);
  }

  @ApiOperation({ summary: '获取打卡记录详情' })
  @ApiResponse({ status: 200, description: '获取成功', type: CheckinRecord })
  @Get(':id')
  async findOne(@Param('id') id: number): Promise<CheckinRecord> {
    return this.checkinService.findById(id);
  }

  @ApiOperation({ summary: '删除打卡记录' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @Delete(':id')
  async remove(@Param('id') id: number): Promise<{ message: string }> {
    await this.checkinService.remove(id);
    return { message: '打卡记录删除成功' };
  }
} 
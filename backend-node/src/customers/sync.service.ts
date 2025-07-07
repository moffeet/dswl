import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { AmapService } from './services/amap.service';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 客户数据同步服务
 * 负责从外部系统同步客户数据
 * 同步规则：
 * - 以客户ID为基准进行匹配
 * - 新客户：同步门店地址并通过高德API计算经纬度
 * - 现有客户：只更新客户名称，门店地址以当前系统为准
 */
@Injectable()
export class CustomerSyncService {
  private readonly logger = new Logger(CustomerSyncService.name);

  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    private readonly amapService: AmapService,
  ) {}

  /**
   * 从外部系统同步客户数据
   */
  async syncFromExternalSystem(updateBy: string = '系统管理员'): Promise<{
    success: boolean;
    message: string;
    syncedCount: number;
    createdCount: number;
    updatedCount: number;
    skippedCount: number;
    lastSyncTime: Date;
  }> {
    this.logger.log('开始从外部系统同步客户数据...');
    
    try {
      // 读取模拟的外部系统数据
      const externalData = this.loadExternalSystemData();
      
      let syncedCount = 0;
      let createdCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;
      
      const syncTime = new Date();

      for (const externalCustomer of externalData.customers) {
        try {
          // 根据客户编号查找现有客户
          const existingCustomer = await this.customerRepository.findOne({
            where: { customerNumber: externalCustomer.customerNumber }
          });

          if (existingCustomer) {
            // 更新现有客户（保留地址信息）
            const updatedCustomer = await this.updateCustomerFromExternal(
              existingCustomer,
              externalCustomer,
              syncTime,
              updateBy
            );
            
            if (updatedCustomer) {
              updatedCount++;
              this.logger.log(`更新客户: ${externalCustomer.customerName} (编号: ${externalCustomer.customerNumber})`);
            } else {
              skippedCount++;
              this.logger.log(`跳过客户: ${externalCustomer.customerName} (编号: ${externalCustomer.customerNumber}) - 无需更新`);
            }
          } else {
            // 创建新客户
            await this.createCustomerFromExternal(externalCustomer, syncTime, updateBy);
            createdCount++;
            this.logger.log(`创建新客户: ${externalCustomer.customerName} (编号: ${externalCustomer.customerNumber})`);
          }
          
          syncedCount++;
        } catch (error) {
          this.logger.error(`同步客户失败 (编号: ${externalCustomer.customerNumber}): ${error.message}`);
          skippedCount++;
        }
      }

      const result = {
        success: true,
        message: `同步完成：处理 ${syncedCount} 个客户，创建 ${createdCount} 个，更新 ${updatedCount} 个，跳过 ${skippedCount} 个`,
        syncedCount,
        createdCount,
        updatedCount,
        skippedCount,
        lastSyncTime: syncTime
      };

      this.logger.log(result.message);
      return result;

    } catch (error) {
      this.logger.error(`同步失败: ${error.message}`, error.stack);
      return {
        success: false,
        message: `同步失败: ${error.message}`,
        syncedCount: 0,
        createdCount: 0,
        updatedCount: 0,
        skippedCount: 0,
        lastSyncTime: new Date()
      };
    }
  }

  /**
   * 加载外部系统模拟数据
   */
  private loadExternalSystemData(): any {
    try {
      const dataPath = path.join(__dirname, '../mock/external-system-data.json');
      const rawData = fs.readFileSync(dataPath, 'utf8');
      return JSON.parse(rawData);
    } catch (error) {
      this.logger.error(`读取外部系统数据失败: ${error.message}`);
      throw new Error('无法读取外部系统数据');
    }
  }

  /**
   * 从外部数据创建新客户
   */
  private async createCustomerFromExternal(externalCustomer: any, syncTime: Date, updateBy: string): Promise<Customer> {
    const customer = new Customer();

    // 设置基本信息（来自外部系统）
    customer.customerNumber = externalCustomer.customerNumber;
    customer.customerName = externalCustomer.customerName;
    customer.storeAddress = externalCustomer.storeAddress;
    customer.status = 'active';

    // 通过高德API获取门店地址的经纬度
    if (externalCustomer.storeAddress) {
      try {
        this.logger.log(`正在获取门店地址经纬度: ${externalCustomer.storeAddress}`);
        const geocodeResult = await this.amapService.geocode(externalCustomer.storeAddress);

        if (geocodeResult && geocodeResult.longitude && geocodeResult.latitude) {
          customer.storeLongitude = geocodeResult.longitude;
          customer.storeLatitude = geocodeResult.latitude;
          this.logger.log(`门店地址经纬度获取成功: ${geocodeResult.longitude}, ${geocodeResult.latitude}`);
        } else {
          this.logger.warn(`门店地址经纬度获取失败: ${externalCustomer.storeAddress}`);
        }
      } catch (error) {
        this.logger.error(`获取门店地址经纬度时出错: ${error.message}`);
      }
    }

    // 设置同步信息
    customer.lastSyncTime = syncTime;
    customer.updateBy = updateBy;

    // 仓库地址暂时为空，等待后续手动设置
    customer.warehouseAddress = null;
    customer.warehouseLongitude = null;
    customer.warehouseLatitude = null;

    return await this.customerRepository.save(customer);
  }

  /**
   * 从外部数据更新现有客户
   */
  private async updateCustomerFromExternal(
    existingCustomer: Customer,
    externalCustomer: any,
    syncTime: Date,
    updateBy: string
  ): Promise<Customer | null> {
    let hasChanges = false;

    // 只检查并更新客户名称（门店地址以当前系统为准，不同步）
    if (existingCustomer.customerName !== externalCustomer.customerName) {
      existingCustomer.customerName = externalCustomer.customerName;
      hasChanges = true;
      this.logger.log(`更新客户名称: ${existingCustomer.customerNumber} - ${externalCustomer.customerName}`);
    }

    if (hasChanges) {
      existingCustomer.lastSyncTime = syncTime;
      existingCustomer.updateBy = updateBy;
      return await this.customerRepository.save(existingCustomer);
    }

    return null; // 无需更新
  }



  /**
   * 获取同步元数据
   */
  async getSyncMetadata(): Promise<any> {
    try {
      // 获取外部系统数据
      const externalData = this.loadExternalSystemData();

      // 获取当前系统客户数量
      const currentCustomerCount = await this.customerRepository.count();

      // 获取最后同步时间（查找最近一次同步的客户）
      const lastSyncCustomer = await this.customerRepository
        .createQueryBuilder('customer')
        .where('customer.lastSyncTime IS NOT NULL')
        .orderBy('customer.lastSyncTime', 'DESC')
        .getOne();

      return {
        dataSource: externalData.syncMetadata?.dataSource || '外部ERP系统',
        currentCustomerCount: currentCustomerCount,
        externalCustomerCount: externalData.customers?.length || 0,
        lastSyncTime: lastSyncCustomer?.lastSyncTime || null,
        syncVersion: externalData.syncMetadata?.syncVersion || 'v1.2.0'
      };
    } catch (error) {
      this.logger.error(`获取同步元数据失败: ${error.message}`);
      return {
        dataSource: '外部ERP系统',
        currentCustomerCount: 0,
        externalCustomerCount: 0,
        lastSyncTime: null,
        syncVersion: 'v1.2.0'
      };
    }
  }
}

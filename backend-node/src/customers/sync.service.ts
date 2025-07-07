import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 客户数据同步服务
 * 负责从外部系统同步客户数据
 * 同步规则：
 * - 以客户ID为基准进行匹配
 * - 门店地址和仓库地址以当前系统为准（不同步）
 * - 其他信息（客户名称、联系人等）以外部系统为准
 */
@Injectable()
export class CustomerSyncService {
  private readonly logger = new Logger(CustomerSyncService.name);

  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
  ) {}

  /**
   * 从外部系统同步客户数据
   */
  async syncFromExternalSystem(): Promise<{
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
          // 根据客户ID查找现有客户
          const existingCustomer = await this.customerRepository.findOne({
            where: { id: externalCustomer.id }
          });

          if (existingCustomer) {
            // 更新现有客户（保留地址信息）
            const updatedCustomer = await this.updateCustomerFromExternal(
              existingCustomer, 
              externalCustomer,
              syncTime
            );
            
            if (updatedCustomer) {
              updatedCount++;
              this.logger.log(`更新客户: ${externalCustomer.customerName} (ID: ${externalCustomer.id})`);
            } else {
              skippedCount++;
              this.logger.log(`跳过客户: ${externalCustomer.customerName} (ID: ${externalCustomer.id}) - 无需更新`);
            }
          } else {
            // 创建新客户
            await this.createCustomerFromExternal(externalCustomer, syncTime);
            createdCount++;
            this.logger.log(`创建新客户: ${externalCustomer.customerName} (ID: ${externalCustomer.id})`);
          }
          
          syncedCount++;
        } catch (error) {
          this.logger.error(`同步客户失败 (ID: ${externalCustomer.id}): ${error.message}`);
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
  private async createCustomerFromExternal(externalCustomer: any, syncTime: Date): Promise<Customer> {
    const customer = new Customer();

    // 设置基本信息（来自外部系统）
    // 生成客户编号
    const customerCount = await this.customerRepository.count();
    customer.customerNumber = `C${String(customerCount + 1).padStart(3, '0')}`;
    customer.customerName = externalCustomer.customerName;
    customer.storeAddress = externalCustomer.storeAddress;
    customer.status = 'active';

    // 设置同步信息
    customer.lastSyncTime = syncTime;
    customer.updateBy = '外部系统同步';

    // 仓库地址暂时为空，等待后续手动设置
    customer.warehouseAddress = null;
    customer.storeLongitude = null;
    customer.storeLatitude = null;
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
    syncTime: Date
  ): Promise<Customer | null> {
    let hasChanges = false;

    // 检查并更新客户名称（保留仓库地址信息）
    if (existingCustomer.customerName !== externalCustomer.customerName) {
      existingCustomer.customerName = externalCustomer.customerName;
      hasChanges = true;
    }

    // 检查并更新门店地址
    if (existingCustomer.storeAddress !== externalCustomer.storeAddress) {
      existingCustomer.storeAddress = externalCustomer.storeAddress;
      hasChanges = true;
    }

    if (hasChanges) {
      existingCustomer.lastSyncTime = syncTime;
      existingCustomer.updateBy = '外部系统同步';
      return await this.customerRepository.save(existingCustomer);
    }

    return null; // 无需更新
  }



  /**
   * 获取同步元数据
   */
  async getSyncMetadata(): Promise<any> {
    try {
      const externalData = this.loadExternalSystemData();
      return externalData.syncMetadata;
    } catch (error) {
      this.logger.error(`获取同步元数据失败: ${error.message}`);
      return null;
    }
  }
}

# 外部系统数据同步说明

## 概述

本系统实现了与外部ERP系统的客户数据同步功能。外部系统只包含**客户ID、客户名称和门店地址**三个字段。同步采用模拟数据的方式，实际生产环境中可以替换为真实的外部系统API调用。

## 同步规则

### 数据匹配规则
- **匹配基准**: 以客户ID为基准进行数据匹配
- **新客户**: 外部系统中存在但本系统中不存在的客户将被创建
- **现有客户**: 根据客户ID匹配，更新相应字段

### 字段同步策略

#### 🔄 会被同步的字段（以外部系统为准）
- 客户名称 (customerName)
- 门店地址 (storeAddress)

#### 🔒 不会被同步的字段（以当前系统为准）
- 客户编号 (customerNumber) - 新客户会自动生成
- 仓库地址 (warehouseAddress)
- 门店经纬度 (storeLongitude, storeLatitude)
- 仓库经纬度 (warehouseLongitude, warehouseLatitude)
- 客户状态 (status) - 新客户默认为 active
- 更新人 (updateBy)
- 创建时间 (createdAt)
- 更新时间 (updatedAt)

## 模拟数据结构

### 外部系统客户数据
```json
{
  "syncMetadata": {
    "lastSyncTime": "2024-01-15T08:30:00Z",
    "syncVersion": "v1.2.0",
    "totalCustomers": 6,
    "dataSource": "外部ERP系统",
    "syncStatus": "completed",
    "nextScheduledSync": "2024-01-16T08:30:00Z"
  },
  "customers": [
    {
      "id": 1,
      "customerName": "深圳市腾讯科技有限公司",
      "storeAddress": "深圳市南山区粤海街道科技园南区腾讯滨海大厦1-3层"
    },
    {
      "id": 2,
      "customerName": "阿里巴巴（中国）有限公司",
      "storeAddress": "浙江省杭州市余杭区文一西路969号阿里巴巴西溪园区"
    }
  ]
}
```

### 数据字段说明
- **id**: 客户ID，用于匹配现有客户
- **customerName**: 客户名称，会同步到本系统
- **storeAddress**: 门店地址，会同步到本系统

## API接口

### 1. 执行同步
```
POST /api/customers/sync
```

**响应示例:**
```json
{
  "code": 200,
  "message": "同步完成：处理 6 个客户，创建 1 个，更新 5 个，跳过 0 个",
  "data": {
    "success": true,
    "syncedCount": 6,
    "createdCount": 1,
    "updatedCount": 5,
    "skippedCount": 0,
    "lastSyncTime": "2024-01-15T08:30:00Z"
  }
}
```

### 2. 获取同步元数据
```
GET /api/customers/sync-metadata
```

**响应示例:**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "lastSyncTime": "2024-01-15T08:30:00Z",
    "syncVersion": "v1.2.0",
    "totalCustomers": 6,
    "dataSource": "外部ERP系统",
    "syncStatus": "completed",
    "nextScheduledSync": "2024-01-16T08:30:00Z"
  }
}
```

## 使用方法

### 后端
1. 确保数据库迁移已执行，添加了新的客户字段
2. 启动后端服务
3. 调用同步API或使用前端界面

### 前端
1. 在客户管理页面点击"同步数据"按钮
2. 查看同步状态和结果
3. 同步完成后客户列表会自动刷新

## 扩展说明

### 替换为真实外部系统
要替换为真实的外部系统，需要修改 `CustomerSyncService` 中的 `loadExternalSystemData()` 方法：

```typescript
private async loadExternalSystemData(): Promise<any> {
  // 替换为真实的外部系统API调用
  const response = await fetch('https://external-system-api.com/customers');
  return await response.json();
}
```

### 定时同步
可以使用NestJS的定时任务功能实现自动同步：

```typescript
import { Cron, CronExpression } from '@nestjs/schedule';

@Cron(CronExpression.EVERY_DAY_AT_2AM)
async scheduledSync() {
  await this.syncFromExternalSystem();
}
```

## 注意事项

1. **数据备份**: 同步前建议备份重要数据
2. **权限控制**: 确保只有授权用户可以执行同步操作
3. **错误处理**: 同步过程中的错误会被记录，但不会中断整个同步流程
4. **性能考虑**: 大量数据同步时建议分批处理
5. **数据一致性**: 同步过程中避免手动修改客户数据

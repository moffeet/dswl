import { SetMetadata } from '@nestjs/common';

/**
 * 时间格式化装饰器的元数据键
 */
export const FORMAT_TIME_KEY = 'formatTime';

/**
 * 时间格式化装饰器
 * 用于标记需要格式化时间的控制器方法
 * 
 * @param format 格式化类型：'chinese' | 'iso' | 'relative'
 * 
 * @example
 * ```typescript
 * @Get()
 * @FormatTime('chinese')
 * async getCustomers() {
 *   // 返回的时间字段会自动格式化为中文格式
 * }
 * ```
 */
export const FormatTime = (format: 'chinese' | 'iso' | 'relative' = 'chinese') =>
  SetMetadata(FORMAT_TIME_KEY, format);

/**
 * 中文时间格式装饰器
 * 将时间格式化为：2025-07-11 12:11:01
 */
export const ChineseTime = () => FormatTime('chinese');

/**
 * ISO时间格式装饰器
 * 保持ISO格式：2025-07-11T04:11:01.000Z
 */
export const ISOTime = () => FormatTime('iso');

/**
 * 相对时间格式装饰器
 * 格式化为相对时间：刚刚、5分钟前、2小时前等
 */
export const RelativeTime = () => FormatTime('relative');

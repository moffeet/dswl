/**
 * 日期时间格式化工具类
 * 提供统一的时间格式化功能
 */
export class DateFormatUtil {
  /**
   * 格式化为中文日期时间格式
   * @param date 日期对象或ISO字符串
   * @returns 格式化后的中文日期时间字符串，如：2025-07-11 12:11:01
   */
  static formatDateTime(date: Date | string): string {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return '';
    }

    return dateObj.toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(/\//g, '-');
  }

  /**
   * 格式化为中文日期格式（不含时间）
   * @param date 日期对象或ISO字符串
   * @returns 格式化后的中文日期字符串，如：2025-07-11
   */
  static formatDate(date: Date | string): string {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return '';
    }

    return dateObj.toLocaleDateString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '-');
  }

  /**
   * 格式化为时间格式（不含日期）
   * @param date 日期对象或ISO字符串
   * @returns 格式化后的时间字符串，如：12:11:01
   */
  static formatTime(date: Date | string): string {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return '';
    }

    return dateObj.toLocaleTimeString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }

  /**
   * 格式化为相对时间（如：刚刚、5分钟前、2小时前等）
   * @param date 日期对象或ISO字符串
   * @returns 相对时间字符串
   */
  static formatRelativeTime(date: Date | string): string {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return '';
    }

    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) {
      return '刚刚';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}分钟前`;
    } else if (diffHours < 24) {
      return `${diffHours}小时前`;
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return this.formatDateTime(dateObj);
    }
  }

  /**
   * 格式化为自定义格式
   * @param date 日期对象或ISO字符串
   * @param format 格式字符串，支持：YYYY-年，MM-月，DD-日，HH-时，mm-分，ss-秒
   * @returns 格式化后的字符串
   */
  static formatCustom(date: Date | string, format: string): string {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return '';
    }

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const seconds = String(dateObj.getSeconds()).padStart(2, '0');

    return format
      .replace(/YYYY/g, year.toString())
      .replace(/MM/g, month)
      .replace(/DD/g, day)
      .replace(/HH/g, hours)
      .replace(/mm/g, minutes)
      .replace(/ss/g, seconds);
  }

  /**
   * 将ISO字符串转换为本地时间的Date对象
   * @param isoString ISO格式的时间字符串
   * @returns 本地时间的Date对象
   */
  static parseISOToLocal(isoString: string): Date {
    if (!isoString) return null;
    
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      return null;
    }
    
    return date;
  }

  /**
   * 获取当前时间的格式化字符串
   * @param format 可选的格式类型：'datetime' | 'date' | 'time' | 'iso'
   * @returns 格式化的当前时间字符串
   */
  static getCurrentTime(format: 'datetime' | 'date' | 'time' | 'iso' = 'datetime'): string {
    const now = new Date();
    
    switch (format) {
      case 'date':
        return this.formatDate(now);
      case 'time':
        return this.formatTime(now);
      case 'iso':
        return now.toISOString();
      case 'datetime':
      default:
        return this.formatDateTime(now);
    }
  }
}

import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

// 微信API响应接口
interface WechatAccessTokenResponse {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  openid?: string;
  scope?: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
}

interface WechatPhoneResponse {
  errcode: number;
  errmsg: string;
  phone_info?: {
    phoneNumber: string;
    purePhoneNumber: string;
    countryCode: string;
    watermark: {
      timestamp: number;
      appid: string;
    };
  };
}

interface WechatSessionResponse {
  openid?: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
}

@Injectable()
export class WechatApiService {
  private readonly logger = new Logger(WechatApiService.name);
  
  // 微信小程序配置
  private readonly appId: string;
  private readonly appSecret: string;

  constructor(private configService: ConfigService) {
    // 从环境变量或配置文件获取微信小程序配置
    this.appId = this.configService.get<string>('WECHAT_APPID') || 'your_wechat_appid';
    this.appSecret = this.configService.get<string>('WECHAT_APP_SECRET') || 'your_wechat_app_secret';
    
    this.logger.log(`微信小程序配置 - AppID: ${this.appId}`);
  }

  /**
   * 通过jsCode获取openid
   */
  async getSessionInfo(jsCode: string): Promise<WechatSessionResponse> {
    const url = 'https://api.weixin.qq.com/sns/jscode2session';
    const params = {
      appid: this.appId,
      secret: this.appSecret,
      js_code: jsCode,
      grant_type: 'authorization_code'
    };

    try {
      this.logger.log(`调用微信API获取session信息: ${url}`);
      const response = await axios.get<WechatSessionResponse>(url, { params });
      
      if (response.data.errcode) {
        this.logger.error(`微信API错误: ${response.data.errcode} - ${response.data.errmsg}`);
        throw new HttpException(
          `微信API调用失败: ${response.data.errmsg}`,
          HttpStatus.BAD_REQUEST
        );
      }

      this.logger.log(`成功获取openid: ${response.data.openid}`);
      return response.data;
    } catch (error) {
      this.logger.error('调用微信API失败:', error.message);
      throw new HttpException(
        '获取微信用户信息失败',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 获取小程序全局唯一后台接口调用凭据
   */
  async getAccessToken(): Promise<string> {
    const url = 'https://api.weixin.qq.com/cgi-bin/token';
    const params = {
      grant_type: 'client_credential',
      appid: this.appId,
      secret: this.appSecret
    };

    try {
      this.logger.log(`获取微信access_token: ${url}`);
      const response = await axios.get<WechatAccessTokenResponse>(url, { params });
      
      if (response.data.errcode) {
        this.logger.error(`获取access_token失败: ${response.data.errcode} - ${response.data.errmsg}`);
        throw new HttpException(
          `获取微信access_token失败: ${response.data.errmsg}`,
          HttpStatus.BAD_REQUEST
        );
      }

      this.logger.log('成功获取access_token');
      return response.data.access_token!;
    } catch (error) {
      this.logger.error('获取access_token失败:', error.message);
      throw new HttpException(
        '获取微信access_token失败',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 通过code获取用户手机号
   */
  async getPhoneNumber(code: string): Promise<string> {
    try {
      // 1. 先获取access_token
      const accessToken = await this.getAccessToken();
      
      // 2. 调用获取手机号接口
      const url = `https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${accessToken}`;
      const data = { code };

      this.logger.log(`调用微信获取手机号API: ${url}`);
      const response = await axios.post<WechatPhoneResponse>(url, data);

      if (response.data.errcode !== 0) {
        this.logger.error(`获取手机号失败: ${response.data.errcode} - ${response.data.errmsg}`);
        throw new HttpException(
          `获取手机号失败: ${response.data.errmsg}`,
          HttpStatus.BAD_REQUEST
        );
      }

      const phoneNumber = response.data.phone_info?.purePhoneNumber;
      if (!phoneNumber) {
        throw new HttpException('未能获取到手机号信息', HttpStatus.BAD_REQUEST);
      }

      this.logger.log(`成功获取手机号: ${phoneNumber}`);
      return phoneNumber;
    } catch (error) {
      this.logger.error('获取手机号失败:', error.message);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        '获取手机号失败',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}

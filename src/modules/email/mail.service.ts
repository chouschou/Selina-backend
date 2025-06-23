import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter = nodemailer.createTransport({
    service: 'gmail', // hoặc SMTP khác nếu bạn có
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS, // mật khẩu ứng dụng (App Password)
    },
  });

  async sendOtp(email: string, otp: string): Promise<void> {
    await this.transporter.sendMail({
      from: `"Selina" <${process.env.MAIL_USER}>`,
      to: email,
      subject: 'Xác nhận đăng ký tài khoản - Mã OTP',
      html: `
      <div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
        <h2 style="text-align: center; color: #13835B;">Cửa hàng Selina</h2>
        <h4 style="text-align: center; color: #13835B; font-style: italic;">Trải nghiệm kính thời trang theo cách của bạn!</h4>
        <p>Chào bạn,</p>
        <p>Bạn vừa yêu cầu đăng ký tài khoản tại <strong>cửa hàng kính Selina</strong>.</p>
        <p>Vui lòng sử dụng mã OTP bên dưới để xác thực email của bạn:</p>
        
        <div style="text-align: center; margin: 24px 0;">
          <span style="font-size: 28px; font-weight: bold; color: #13835B; background: #f0fdf4; padding: 12px 24px; border-radius: 8px; display: inline-block; letter-spacing: 4px;">
            ${otp}
          </span>
        </div>

        <p>Mã OTP này sẽ <strong>hết hạn sau 5 phút</strong>.</p>
        <p>Nếu bạn không yêu cầu hành động này, vui lòng bỏ qua email này.</p>

        <p style="margin-top: 32px;">Trân trọng,<br />Đội ngũ Kính Mắt</p>

        <hr style="margin-top: 40px;" />
        <p style="font-size: 12px; color: gray; text-align: center;">
          Bạn nhận được email này vì đã đăng ký tài khoản trên hệ thống Selina.
        </p>
      </div>
    `,
    });
  }

  async sendResetPasswordEmail(email: string, resetLink: string) {
    await this.transporter.sendMail({
      from: `"Selina" <${process.env.MAIL_USER}>`,
      to: email,
      subject: 'Khôi phục mật khẩu',
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #13835B; text-align: center;">Khôi phục mật khẩu</h2>
        <p>Xin chào,</p>
        <p>Bạn đã yêu cầu đặt lại mật khẩu. Nhấn vào nút bên dưới để thay đổi mật khẩu:</p>
        
        <div style="text-align: center; margin: 24px 0;">
          <a href="${resetLink}" target="_blank" style="
            background-color: #13835B;
            color: #fff;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 6px;
            display: inline-block;
            font-weight: bold;
          ">Đặt lại mật khẩu</a>
        </div>

        <p>Nếu bạn không yêu cầu điều này, vui lòng bỏ qua email này.</p>
        <p style="font-size: 0.9rem; color: #888;"><i>Liên kết có hiệu lực trong 5 phút.</i></p>
        
        <hr style="margin-top: 32px;" />
        <p style="font-size: 0.8rem; color: #aaa; text-align: center;">© ${new Date().getFullYear()} Selina Glass Shop</p>
      </div>
    `,
    });
  }
}

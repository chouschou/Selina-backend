// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);
//   await app.listen(process.env.PORT ?? 3000);
// }
// bootstrap();
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { INestApplication } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import * as dotenv from 'dotenv';
import * as express from 'express';

dotenv.config();

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'ap-southeast-1',
});
async function bootstrap() {
  const app: INestApplication = await NestFactory.create(AppModule);

  // Thêm dòng này để parser hiểu các key dạng mảng/object
  app.use(express.urlencoded({ extended: true }));

  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  // Cấu hình ValidationPipe toàn cục với các tùy chọn transform và whitelist
  // app.useGlobalPipes(
  //   new ValidationPipe({
  //     transform: true, // Tự động chuyển kiểu từ chuỗi sang các kiểu dữ liệu thích hợp (ví dụ: chuyển chuỗi 'true' thành boolean true)
  //     whitelist: true, // Loại bỏ các thuộc tính không được định nghĩa trong DTO
  //   }),
  // );
  app.enableCors({
    origin: ['http://localhost:5173', 'https://selina-frontend.vercel.app'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  await app.listen(3000);
}
bootstrap();

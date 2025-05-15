import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AiService } from './AI.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('predict')
  @UseInterceptors(FileInterceptor('file'))
  async predict(@UploadedFile() file: Express.Multer.File) {
    return this.aiService.predictImage(file);
  }
}

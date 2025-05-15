import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import * as FormData from 'form-data';
import { ReadStream } from 'fs';
import { PredictResponse } from './predict-response.interface';

@Injectable()
export class AiService {
  constructor(private readonly httpService: HttpService) {}

  async predictImage(file: Express.Multer.File): Promise<PredictResponse> {
    const form = new FormData();
    form.append('file', file.buffer, file.originalname);

    const response = await lastValueFrom(
      this.httpService.post<PredictResponse>(
        'http://localhost:8000/predict',
        form,
        {
          headers: form.getHeaders(),
        },
      ),
    );

    return response.data as PredictResponse;
  }
}

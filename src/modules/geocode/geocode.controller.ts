import {
  Body,
  Controller,
  Get,
  HttpException,
  Post,
  Query,
} from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
export interface GeocodeResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  // có thể thêm các trường khác nếu cần
}
@Controller('geocode')
export class GeocodeController {
  @Get()
  async getCoordinates(@Query('q') query: string): Promise<GeocodeResult[]> {
    try {
      const response: AxiosResponse<GeocodeResult[]> = await axios.get(
        'https://nominatim.openstreetmap.org/search',
        {
          params: {
            q: query,
            format: 'json',
          },
          headers: {
            'User-Agent': 'your-app-name (sun104@gmail.com)',
          },
        },
      );

      return response.data;
    } catch (error) {
      console.error('Geocoding error:', (error as Error).message);
      throw new Error('Failed to fetch coordinates');
    }
  }
}

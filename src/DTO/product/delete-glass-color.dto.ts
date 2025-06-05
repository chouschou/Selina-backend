import { IsInt, Min } from 'class-validator';

export class DeleteGlassColorDto {
  @IsInt()
  @Min(1)
  glassColorId: number;
}

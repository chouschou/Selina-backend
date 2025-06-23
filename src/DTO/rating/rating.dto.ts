export class CreateRatingDto {
  Value: number;
  Comment?: string;
  ImagePaths?: string[];
}

export class UpdateRatingDto {
  Value?: number;
  Comment?: string;
  ImagePaths?: string[];
}

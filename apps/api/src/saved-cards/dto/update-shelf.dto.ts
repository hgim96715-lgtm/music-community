import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, ValidateIf } from 'class-validator';

export class UpdateShelfDto {
  @ApiProperty({
    description: 'Top 3 , null이면 책장으로',
    nullable: true,
    example: 1,
  })
  @ValidateIf((_, v) => v !== null)
  @IsInt()
  @IsIn([1, 2, 3])
  shelfRank: 1 | 2 | 3 | null;
}

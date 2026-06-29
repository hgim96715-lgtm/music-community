import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsObject, ValidateNested } from 'class-validator';
import { SavedCardCustomizationDto } from './create-saved-card.dto';

export class UpdateSavedCardDto {
  @ApiProperty({ description: '포토카드 꾸밈 JSON만 수정' })
  @IsObject()
  @ValidateNested()
  @Type(() => SavedCardCustomizationDto)
  customization: SavedCardCustomizationDto;
}

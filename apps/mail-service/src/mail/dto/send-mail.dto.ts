import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SendSingleMailDto {
  @IsString()
  @IsNotEmpty()
  to!: string;

  @IsString()
  @IsOptional()
  template_id?: string | null;

  @IsObject()
  @IsOptional()
  variables?: Record<string, string>;
}

export class SendBulkMailDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SendSingleMailDto)
  recipients!: SendSingleMailDto[];

  @IsString()
  @IsOptional()
  campaignId?: string;
}

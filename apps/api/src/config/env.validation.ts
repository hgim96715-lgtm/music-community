import * as Joi from 'joi';
import { EnvKeys } from './env.keys';

export const envValidationSchema = Joi.object({
  [EnvKeys.PORT]: Joi.number().default(3030),
  [EnvKeys.FRONTEND_URL]: Joi.string().uri().required(),
  [EnvKeys.DATABASE_URL]: Joi.string().uri().required(),
  [EnvKeys.POSTGRES_PORT]: Joi.number().port().optional(),
  [EnvKeys.POSTGRES_USER]: Joi.string().optional(),
  [EnvKeys.POSTGRES_PASSWORD]: Joi.string().optional(),
  [EnvKeys.POSTGRES_DB]: Joi.string().default('music_community_db').optional(),
  [EnvKeys.API_JWT_SECRET]: Joi.string().required(),
});

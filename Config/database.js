import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: './config.env' }); // adjust path if needed

export const pool = new Pool({
  user: 'postgres',
  host: '127.0.0.1',
  database: process.env.DB_NAME,
  password: String(process.env.DB_PASSWORD),
  port: Number(process.env.DB_PORT) || 5432,
});
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export const postgresConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: true } : undefined,
      max: 10
    }
  : {
      host: process.env.PGHOST || process.env.DB_HOST || 'localhost',
      port: Number(process.env.PGPORT || process.env.DB_PORT || 5432),
      user: process.env.PGUSER || process.env.DB_USER || 'postgres',
      password: process.env.PGPASSWORD || process.env.DB_PASSWORD,
      database: process.env.PGDATABASE || process.env.DB_NAME || 'daily_log',
      max: 10,
      ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: true } : undefined
    };

const pool = new Pool(postgresConfig);

pool.on('error', (error) => {
  console.error('Koneksi PostgreSQL idle mengalami error:', error.message);
});

export default pool;
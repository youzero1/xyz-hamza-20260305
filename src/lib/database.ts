import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Calculation } from '@/entities/Calculation';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DATABASE_PATH || './data/xyz.db';

// Ensure data directory exists
const dataDir = path.dirname(path.resolve(dbPath));
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let dataSource: DataSource | null = null;

export async function getDataSource(): Promise<DataSource> {
  if (dataSource && dataSource.isInitialized) {
    return dataSource;
  }

  dataSource = new DataSource({
    type: 'better-sqlite3',
    database: path.resolve(dbPath),
    synchronize: true,
    logging: false,
    entities: [Calculation],
  });

  await dataSource.initialize();
  return dataSource;
}

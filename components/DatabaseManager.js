const sqlite3 = require('sqlite3').verbose();
const mysql = require('mysql2/promise');
const mariadb = require('mariadb');
const { MongoClient } = require('mongodb');

class DatabaseManager {
  constructor() {
    this.databases = {};
  }
  async registerDatabase(dbConfig) {
    try {
      const { name, type, connection, migrations } = dbConfig;
      if (!name || !type || !connection) {
        throw new Error("Invalid DB configuration (name, type, and connection are required).");
      }
      let dbInstance = null;
      if (type === 'sqlite') {
        dbInstance = new sqlite3.Database(connection, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
          if (err) console.error(`DatabaseManager: SQLite connection error for [${name}]`, err);
          else console.log(`DatabaseManager: Connected to SQLite DB [${name}].`);
        });
      } else if (type === 'mysql') {
        dbInstance = await mysql.createConnection(connection);
        console.log(`DatabaseManager: Connected to MySQL DB [${name}].`);
      } else if (type === 'mariadb') {
        dbInstance = await mariadb.createConnection(connection);
        console.log(`DatabaseManager: Connected to MariaDB [${name}].`);
      } else if (type === 'mongodb') {
        const client = new MongoClient(connection.uri, connection.options);
        await client.connect();
        dbInstance = client.db(connection.dbName);
        console.log(`DatabaseManager: Connected to MongoDB [${name}].`);
      } else {
        throw new Error(`Unsupported DB type: ${type}`);
      }
      this.databases[name] = {
        type,
        instance: dbInstance,
        migrations: migrations || [],
        migrationVersion: 0
      };
    } catch (error) {
      console.error('DatabaseManager.registerDatabase Error:', error);
    }
  }
  async migrateDatabase(name) {
    try {
      const db = this.databases[name];
      if (!db) {
        throw new Error(`Database [${name}] not found.`);
      }
      console.log(`DatabaseManager: Starting migrations for [${name}].`);
      for (const migration of db.migrations) {
        if (migration.up) {
          console.log(`DatabaseManager: Applying migration version ${migration.version} for [${name}].`);
          try {
            if (db.type === 'sqlite') {
              await new Promise((resolve, reject) => {
                db.instance.exec(migration.up, (err) => {
                  if (err) reject(err);
                  else resolve();
                });
              });
            } else if (db.type === 'mysql' || db.type === 'mariadb') {
              await db.instance.query(migration.up);
            } else if (db.type === 'mongodb') {
              const migrationFunc = new Function('db', migration.up);
              await migrationFunc(db.instance);
            }
            db.migrationVersion = migration.version;
            console.log(`DatabaseManager: Migration version ${migration.version} for [${name}] succeeded.`);
          } catch (err) {
            console.error(`DatabaseManager: Migration version ${migration.version} for [${name}] failed:`, err);
            break;
          }
        }
      }
    } catch (error) {
      console.error('DatabaseManager.migrateDatabase Error:', error);
    }
  }
  async migrateAll() {
    for (const name in this.databases) {
      await this.migrateDatabase(name);
    }
  }
}

module.exports = DatabaseManager;

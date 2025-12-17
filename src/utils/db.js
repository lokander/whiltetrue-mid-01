const sqlite3 = require('sqlite3').verbose();
const deasync = require('deasync');
const path = require('path');

let db;

function getDatabase() {
  if (!db) {
    const dbPath = process.env.NODE_ENV === 'test'
      ? ':memory:'
      : path.join(__dirname, '../../expense-tracker.db');

    const rawDb = new sqlite3.Database(dbPath);

    // Enable foreign keys and WAL mode
    rawDb.serialize(() => {
      rawDb.run('PRAGMA foreign_keys = ON');
      rawDb.run('PRAGMA journal_mode = WAL');
    });

    // Create wrapper with sync API using deasync
    db = {
      _db: rawDb,

      exec(sql) {
        let done = false;
        let error;
        rawDb.exec(sql, (err) => {
          error = err;
          done = true;
        });
        deasync.loopWhile(() => !done);
        if (error) throw error;
      },

      prepare(sql) {
        return {
          run(...params) {
            let result;
            let error;
            let done = false;
            rawDb.run(sql, params, function(err) {
              if (err) {
                error = err;
              } else {
                result = { lastInsertRowid: this.lastID, changes: this.changes };
              }
              done = true;
            });
            deasync.loopWhile(() => !done);
            if (error) throw error;
            return result || { lastInsertRowid: 0, changes: 0 };
          },

          get(...params) {
            let result;
            let error;
            let done = false;
            rawDb.get(sql, params, (err, row) => {
              error = err;
              result = row;
              done = true;
            });
            deasync.loopWhile(() => !done);
            if (error) throw error;
            return result;
          },

          all(...params) {
            let result;
            let error;
            let done = false;
            rawDb.all(sql, params, (err, rows) => {
              error = err;
              result = rows;
              done = true;
            });
            deasync.loopWhile(() => !done);
            if (error) throw error;
            return result || [];
          }
        };
      },

      close() {
        rawDb.close();
      }
    };
  }
  return db;
}

function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { getDatabase, closeDatabase };

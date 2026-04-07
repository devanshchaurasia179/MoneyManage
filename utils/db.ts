import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase;

// Initialize DB
export const initDB = () => {
  if (!db) {
    db = SQLite.openDatabaseSync("finance.db");

    // Create tables
    db.execSync(`
      CREATE TABLE IF NOT EXISTS user (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        currency TEXT
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        amount REAL,
        type TEXT, -- income / expense
        category TEXT,
        date TEXT,
        note TEXT
      );
    `);
  }

  return db;
};

// Get DB instance
export const getDB = () => {
  if (!db) {
    throw new Error("Database not initialized. Call initDB() first.");
  }
  return db;
};


// ---------------- USER FUNCTIONS ----------------

// Get user
export const getUser = () => {
  const database = getDB();
  return database.getAllSync("SELECT * FROM user LIMIT 1");
};

// Insert user
export const insertUser = (name: string, currency: string) => {
  const database = getDB();
  database.runSync(
    "INSERT INTO user (name, currency) VALUES (?, ?)",
    [name, currency]
  );
};


// ---------------- TRANSACTION FUNCTIONS ----------------

// Add transaction
export const addTransaction = (
  title: string,
  amount: number,
  type: "income" | "expense",
  category: string,
  date: string,
  note:string
) => {
  const database = getDB();
  database.runSync(
    `INSERT INTO transactions (title, amount, type, category, date, note)
     VALUES (?, ?, ?, ?, ?,?)`,
    [title, amount, type, category, date, note]
  );
};

// Get all transactions
export const getTransactions = () => {
  const database = getDB();
  return database.getAllSync("SELECT * FROM transactions ORDER BY date DESC");
};

// Delete transaction
export const deleteTransaction = (id: number) => {
  const database = getDB();
  database.runSync("DELETE FROM transactions WHERE id = ?", [id]);
};
import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase;

export const initDB = () => {
  if (!db) {
    db = SQLite.openDatabaseSync("finance.db");

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
        type TEXT,
        category TEXT,
        date TEXT,
        note TEXT,
        archived INTEGER DEFAULT 0,
        exclude_from_balance INTEGER DEFAULT 0
      );
    `);

    // Run migrations for existing DBs that don't have new columns yet
    try {
      db.execSync(`ALTER TABLE transactions ADD COLUMN archived INTEGER DEFAULT 0;`);
    } catch (_) {}
    try {
      db.execSync(`ALTER TABLE transactions ADD COLUMN exclude_from_balance INTEGER DEFAULT 0;`);
    } catch (_) {}
  }

  return db;
};

export const getDB = () => {
  if (!db) throw new Error("Database not initialized. Call initDB() first.");
  return db;
};


// ─── USER ──────────────────────────────────────────────────

export const getUser = () => {
  const database = getDB();
  return database.getAllSync("SELECT * FROM user LIMIT 1") as {
    id: number;
    name: string;
    currency: string;
  }[];
};

export const insertUser = (name: string, currency: string) => {
  const database = getDB();
  database.runSync("INSERT INTO user (name, currency) VALUES (?, ?)", [name, currency]);
};

export const updateUser = (name: string, currency: string) => {
  const database = getDB();
  database.runSync("UPDATE user SET name = ?, currency = ? WHERE id = 1", [name, currency]);
};


// ─── TRANSACTIONS ──────────────────────────────────────────

export type Transaction = {
  id: number;
  title: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
  note: string;
  archived: number;         // 0 = active, 1 = archived
  exclude_from_balance: number; // 0 = counts, 1 = excluded
};

export const addTransaction = (
  title: string,
  amount: number,
  type: "income" | "expense",
  category: string,
  date: string,
  note: string
) => {
  const database = getDB();
  database.runSync(
    `INSERT INTO transactions (title, amount, type, category, date, note, archived, exclude_from_balance)
     VALUES (?, ?, ?, ?, ?, ?, 0, 0)`,
    [title, amount, type, category, date, note]
  );
};

// Active (non-archived) transactions
export const getTransactions = (): Transaction[] => {
  const database = getDB();
  return database.getAllSync(
    "SELECT * FROM transactions WHERE archived = 0 ORDER BY date DESC"
  ) as Transaction[];
};

// Archived transactions
export const getArchivedTransactions = (): Transaction[] => {
  const database = getDB();
  return database.getAllSync(
    "SELECT * FROM transactions WHERE archived = 1 ORDER BY date DESC"
  ) as Transaction[];
};

// Single transaction by id
export const getTransactionById = (id: number): Transaction | null => {
  const database = getDB();
  const rows = database.getAllSync(
    "SELECT * FROM transactions WHERE id = ?",
    [id]
  ) as Transaction[];
  return rows[0] ?? null;
};

// Permanently delete
export const deleteTransaction = (id: number) => {
  const database = getDB();
  database.runSync("DELETE FROM transactions WHERE id = ?", [id]);
};

// Archive (soft-delete) — optionally exclude from balance
export const archiveTransaction = (id: number, excludeFromBalance: boolean) => {
  const database = getDB();
  database.runSync(
    "UPDATE transactions SET archived = 1, exclude_from_balance = ? WHERE id = ?",
    [excludeFromBalance ? 1 : 0, id]
  );
};

// Unarchive
export const unarchiveTransaction = (id: number) => {
  const database = getDB();
  database.runSync(
    "UPDATE transactions SET archived = 0, exclude_from_balance = 0 WHERE id = ?",
    [id]
  );
};
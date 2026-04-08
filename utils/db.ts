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
        starred INTEGER DEFAULT 0,
        exclude_from_balance INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS budgets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT UNIQUE,
        amount REAL DEFAULT 0
      );
    `);

    // ─── Migrations for existing databases ───────────────────────────────
    // If the DB already has the old "archived" column, rename it to "starred"
    // SQLite doesn't support RENAME COLUMN before 3.25.0, so we use a safe
    // ADD + copy approach inside a transaction.
    try {
      // Check if "archived" column exists (old schema)
      const cols = db.getAllSync(`PRAGMA table_info(transactions)`) as { name: string }[];
      const hasArchived = cols.some((c) => c.name === "archived");
      const hasStarred  = cols.some((c) => c.name === "starred");

      if (hasArchived && !hasStarred) {
        // Add the new column, copy data, leave old column in place
        // (SQLite can't drop columns easily — we just stop using it)
        db.execSync(`ALTER TABLE transactions ADD COLUMN starred INTEGER DEFAULT 0;`);
        db.execSync(`UPDATE transactions SET starred = archived;`);
      }
    } catch (_) {}

    try {
      db.execSync(`ALTER TABLE transactions ADD COLUMN starred INTEGER DEFAULT 0;`);
    } catch (_) {}

    try {
      db.execSync(`ALTER TABLE transactions ADD COLUMN exclude_from_balance INTEGER DEFAULT 0;`);
    } catch (_) {}

    try {
      db.execSync(`
        CREATE TABLE IF NOT EXISTS budgets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          category TEXT UNIQUE,
          amount REAL DEFAULT 0
        );
      `);
    } catch (_) {}
  }

  return db;
};

export const getDB = () => {
  if (!db) throw new Error("Database not initialized. Call initDB() first.");
  return db;
};


// ─── USER ───────────────────────────────────────────────────────────────────

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


// ─── TRANSACTIONS ────────────────────────────────────────────────────────────

export type Transaction = {
  id: number;
  title: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
  note: string;
  /**
   * starred = 1 means this transaction is saved/bookmarked by the user.
   * It still appears in ALL transaction lists and still counts toward
   * the monthly balance UNLESS exclude_from_balance is also set to 1.
   */
  starred: number;
  /**
   * exclude_from_balance = 1 means this transaction is intentionally
   * kept out of balance/summary calculations (e.g. a one-time transfer
   * the user doesn't want skewing their monthly totals).
   * This is independent of starred — you can exclude without starring.
   */
  exclude_from_balance: number;
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
    `INSERT INTO transactions (title, amount, type, category, date, note, starred, exclude_from_balance)
     VALUES (?, ?, ?, ?, ?, ?, 0, 0)`,
    [title, amount, type, category, date, note]
  );
};

/** Returns ALL transactions (starred and unstarred) ordered by date. */
export const getTransactions = (): Transaction[] => {
  const database = getDB();
  return database.getAllSync(
    "SELECT * FROM transactions ORDER BY date DESC"
  ) as Transaction[];
};

/** Returns only starred/saved transactions — still shown in main list too. */
export const getStarredTransactions = (): Transaction[] => {
  const database = getDB();
  return database.getAllSync(
    "SELECT * FROM transactions WHERE starred = 1 ORDER BY date DESC"
  ) as Transaction[];
};

export const getTransactionById = (id: number): Transaction | null => {
  const database = getDB();
  const rows = database.getAllSync(
    "SELECT * FROM transactions WHERE id = ?",
    [id]
  ) as Transaction[];
  return rows[0] ?? null;
};

export const deleteTransaction = (id: number) => {
  const database = getDB();
  database.runSync("DELETE FROM transactions WHERE id = ?", [id]);
};

/**
 * Star (bookmark) a transaction.
 * Pass excludeFromBalance = true if you also want it skipped in balance totals.
 * The transaction remains fully visible in all lists.
 */
export const starTransaction = (id: number, excludeFromBalance: boolean = false) => {
  const database = getDB();
  database.runSync(
    "UPDATE transactions SET starred = 1, exclude_from_balance = ? WHERE id = ?",
    [excludeFromBalance ? 1 : 0, id]
  );
};

/** Remove the star from a transaction. Restores it to balance calculations. */
export const unstarTransaction = (id: number) => {
  const database = getDB();
  database.runSync(
    "UPDATE transactions SET starred = 0, exclude_from_balance = 0 WHERE id = ?",
    [id]
  );
};

/**
 * Toggle star state on a transaction.
 * Convenience helper — call this from a star button press.
 */
export const toggleStar = (id: number, currentlyStarred: boolean) => {
  if (currentlyStarred) {
    unstarTransaction(id);
  } else {
    starTransaction(id);
  }
};

/**
 * Independently toggle whether a transaction counts toward balance,
 * without changing its starred state.
 */
export const setExcludeFromBalance = (id: number, exclude: boolean) => {
  const database = getDB();
  database.runSync(
    "UPDATE transactions SET exclude_from_balance = ? WHERE id = ?",
    [exclude ? 1 : 0, id]
  );
};

export const updateTransaction = (
  id: number,
  title: string,
  amount: number,
  type: "income" | "expense",
  category: string,
  date: string,
  note: string
) => {
  const database = getDB();
  database.runSync(
    `UPDATE transactions
     SET title = ?, amount = ?, type = ?, category = ?, date = ?, note = ?
     WHERE id = ?`,
    [title, amount, type, category, date, note, id]
  );
};


// ─── BUDGETS ─────────────────────────────────────────────────────────────────

export type Budget = {
  id: number;
  category: string;
  amount: number;
};

export const getAllBudgets = (): Record<string, number> => {
  const database = getDB();
  const rows = database.getAllSync("SELECT * FROM budgets") as Budget[];
  const map: Record<string, number> = {};
  rows.forEach((r) => { map[r.category] = r.amount; });
  return map;
};

export const upsertBudget = (category: string, amount: number) => {
  const database = getDB();
  database.runSync(
    `INSERT INTO budgets (category, amount) VALUES (?, ?)
     ON CONFLICT(category) DO UPDATE SET amount = excluded.amount`,
    [category, amount]
  );
};

export const deleteBudget = (category: string) => {
  const database = getDB();
  database.runSync("DELETE FROM budgets WHERE category = ?", [category]);
};
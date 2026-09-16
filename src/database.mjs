import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import crypto from "node:crypto";

const dir=path.join(os.homedir(),"Documents","MojeFinancije");
fs.mkdirSync(dir,{recursive:true});
const db=new Database(path.join(dir,"financije-native.db"));
db.pragma("journal_mode = WAL");
db.exec(`
CREATE TABLE IF NOT EXISTS transactions(
 id TEXT PRIMARY KEY,user_id TEXT NOT NULL,tx_date TEXT NOT NULL,kind TEXT NOT NULL,
 amount REAL NOT NULL,category TEXT NOT NULL,account TEXT NOT NULL,description TEXT DEFAULT '',
 synced INTEGER DEFAULT 0,updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS budgets(
 id TEXT PRIMARY KEY,user_id TEXT NOT NULL,month TEXT NOT NULL,category TEXT NOT NULL,
 amount REAL NOT NULL,synced INTEGER DEFAULT 0,updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS categories(
 id TEXT PRIMARY KEY,user_id TEXT NOT NULL,name TEXT NOT NULL,kind TEXT NOT NULL,
 color TEXT NOT NULL,synced INTEGER DEFAULT 0,updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS accounts(
 id TEXT PRIMARY KEY,user_id TEXT NOT NULL,name TEXT NOT NULL,opening_balance REAL DEFAULT 0,
 synced INTEGER DEFAULT 0,updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS session(key TEXT PRIMARY KEY,value TEXT);
`);
const tables=new Set(["transactions","budgets","categories","accounts"]);
const table=n=>{if(!tables.has(n))throw Error("Nepoznata tablica");return n};
export const localDb={
 path:path.join(dir,"financije-native.db"),
 all:(name,uid)=>db.prepare("SELECT * FROM "+table(name)+" WHERE user_id=? ORDER BY updated_at DESC").all(uid),
 unsynced:(name,uid)=>db.prepare("SELECT * FROM "+table(name)+" WHERE user_id=? AND synced=0").all(uid),
 put(name,uid,data,synced=0){const now=data.updated_at||new Date().toISOString(),id=data.id||crypto.randomUUID();const fields={
   transactions:["tx_date","kind","amount","category","account","description"],
   budgets:["month","category","amount"],categories:["name","kind","color"],accounts:["name","opening_balance"]
 }[table(name)];const row={id,user_id:uid,...data,synced,updated_at:now};const cols=["id","user_id",...fields,"synced","updated_at"];const sql="INSERT OR REPLACE INTO "+name+"("+cols.join(",")+") VALUES("+cols.map(x=>"@"+x).join(",")+")";db.prepare(sql).run(row);return row},
 remove:(name,id)=>db.prepare("DELETE FROM "+table(name)+" WHERE id=?").run(id),
 markSynced:(name,id)=>db.prepare("UPDATE "+table(name)+" SET synced=1 WHERE id=?").run(id),
 session(value){if(value===undefined){const r=db.prepare("SELECT value FROM session WHERE key='auth'").get();return r?JSON.parse(r.value):null}db.prepare("INSERT OR REPLACE INTO session(key,value) VALUES('auth',?)").run(value?JSON.stringify(value):"null")}
};

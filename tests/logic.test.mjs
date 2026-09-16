import test from "node:test";import assert from "node:assert/strict";import{summary,validateTransaction,csv}from"../src/logic.mjs";
const rows=[{tx_date:"2026-09-01",kind:"Prihod",amount:1500,category:"Plaća",account:"Glavni",description:"Plaća"},{tx_date:"2026-09-02",kind:"Rashod",amount:100,category:"Hrana",account:"Glavni",description:"Kupnja"}];
test("sažetak",()=>assert.deepEqual(summary(rows,"2026-09"),{income:1500,expense:100,balance:1400}));
test("validacija",()=>assert.equal(validateTransaction({...rows[0],amount:"25.50"}).amount,25.5));
test("neispravan iznos",()=>assert.throws(()=>validateTransaction({...rows[0],amount:0})));
test("CSV",()=>assert.match(csv(rows),/Datum;Vrsta/));

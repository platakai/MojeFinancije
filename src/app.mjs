import {
 QApplication,QMainWindow,QWidget,QLabel,QPushButton,QLineEdit,QComboBox,QTableWidget,
 QTableWidgetItem,QBoxLayout,Direction,QStackedWidget,QDialog,QMessageBox,QFileDialog,AcceptMode,DialogCode
} from "@nodegui/nodegui";
import fs from "node:fs";
import {config} from "./config.mjs";
import {firebaseAuth,cloud} from "./firebase-rest.mjs";
import {localDb} from "./database.mjs";
import {euro,summary,validateTransaction,csv} from "./logic.mjs";

// Qode creates QApplication before loading this JavaScript module.
const app=QApplication.instance();
const css=`
QWidget{font-family:'Segoe UI';font-size:13px;color:#172033;background:#F3F6FA}
QLabel#title{font-size:27px;font-weight:700} QLabel#muted{color:#64748B}
QWidget#nav{background:#172033;color:white} QWidget#nav QLabel{color:white;background:#172033}
QPushButton{border:0;border-radius:7px;padding:10px 14px;background:#E2E8F0}
QPushButton#primary{background:#2563EB;color:white;font-weight:600} QPushButton#navButton{background:#172033;color:#CBD5E1;text-align:left;padding:13px}
QPushButton#navButton:hover{background:#243149;color:white} QLineEdit,QComboBox{background:white;border:1px solid #D8E0EA;border-radius:7px;padding:9px}
QWidget#card{background:white;border:1px solid #E2E8F0;border-radius:10px;padding:14px}
QLabel#metric{font-size:22px;font-weight:700;background:white} QLabel#cardText{background:white}
QTableWidget{background:white;border:1px solid #E2E8F0;gridline-color:#E2E8F0}
`;
const msg=(title,text)=>{const m=new QMessageBox();m.setWindowTitle(title);m.setText(text);m.exec()};
const vbox=(w,spacing=10)=>{const l=new QBoxLayout(Direction.TopToBottom);l.setSpacing(spacing);w.setLayout(l);return l};
const hbox=(w,spacing=10)=>{const l=new QBoxLayout(Direction.LeftToRight);l.setSpacing(spacing);w.setLayout(l);return l};
const label=(text,id="")=>{const l=new QLabel();l.setText(text);if(id)l.setObjectName(id);return l};
const button=(text,fn,id="")=>{const b=new QPushButton();b.setText(text);if(id)b.setObjectName(id);b.addEventListener("clicked",fn);return b};
let mainWindow,authWindow,currentUser;

function requireConfig(){if(config.ready)return true;msg("Firebase nije konfiguriran","Kopirajte .env.example u .env i upišite FIREBASE_API_KEY i FIREBASE_PROJECT_ID.");return false}
function authScreen(register=false){
 const previous=authWindow;authWindow=new QMainWindow();authWindow.setWindowTitle("Moje Financije – "+(register?"Registracija":"Prijava"));authWindow.resize(880,620);
 const root=new QWidget(),layout=hbox(root,0),brand=new QWidget(),formSide=new QWidget();brand.setObjectName("nav");brand.setFixedWidth(390);layout.addWidget(brand);layout.addWidget(formSide);
 const bl=vbox(brand,18);bl.setContentsMargins(55,100,45,60);bl.addWidget(label("MF"));const bt=label("Moje Financije","title");bl.addWidget(bt);bl.addWidget(label("Pratite prihode, rashode i budžete.\nPodaci se spremaju lokalno i sinkroniziraju\ns Firebaseom.","muted"));bl.addWidget(label("✓ Lokalna SQLite baza\n\n✓ Firebase sinkronizacija\n\n✓ Rad bez interneta"));
 const fl=vbox(formSide,10);fl.setContentsMargins(65,65,65,50);fl.addWidget(label(register?"Izradite račun":"Dobro došli","title"));fl.addWidget(label(register?"Započnite pratiti svoje financije":"Prijavite se u svoj račun","muted"));
 const email=new QLineEdit();email.setPlaceholderText("E-mail adresa");const pass=new QLineEdit();pass.setPlaceholderText("Lozinka – najmanje 6 znakova");pass.setEchoMode(2);fl.addWidget(email);fl.addWidget(pass);
 fl.addWidget(button(register?"Registriraj se":"Prijavi se",async()=>{if(!requireConfig())return;try{currentUser=register?await firebaseAuth.register(email.text(),pass.text()):await firebaseAuth.login(email.text(),pass.text());openMain()}catch(e){msg("Prijava nije uspjela",e.message)}},"primary"));
 fl.addWidget(button("Nastavi kao gost",async()=>{if(!requireConfig())return;try{currentUser=await firebaseAuth.guest();openMain()}catch(e){msg("Prijava nije uspjela",e.message)}}));
 fl.addWidget(button("Samo lokalno, bez prijave",()=>{currentUser={localId:"local-offline",email:"Lokalni korisnik"};openMain()}));
 fl.addWidget(label("Google prijava nije uključena jer zahtijeva preglednik.","muted"));
 fl.addWidget(button(register?"Već imam račun":"Izradi novi račun",()=>authScreen(!register)));
 root.setStyleSheet(css);authWindow.setCentralWidget(root);authWindow.show();if(previous)previous.close();
}
function cardMetric(title,value){const w=new QWidget();w.setObjectName("card");const l=vbox(w,8),valueLabel=label(value,"metric");l.addWidget(label(title,"cardText"));l.addWidget(valueLabel);return{widget:w,valueLabel}}
function openMain(){
 const previous=authWindow;mainWindow=new QMainWindow();mainWindow.setWindowTitle("Moje Financije");mainWindow.resize(1280,800);
 const root=new QWidget(),layout=hbox(root,0),nav=new QWidget(),stack=new QStackedWidget();nav.setObjectName("nav");nav.setFixedWidth(220);layout.addWidget(nav);layout.addWidget(stack);
 const nl=vbox(nav,5);nl.setContentsMargins(12,28,12,20);nl.addWidget(label("MOJE FINANCIJE"));const pages=[makeDashboard(),makeTransactions(),makeBudgets(),makeSettings()];
 [["Nadzorna ploča",0],["Transakcije",1],["Budžeti",2],["Postavke",3]].forEach(x=>nl.addWidget(button(x[0],()=>{refreshAll(pages);stack.setCurrentIndex(x[1])},"navButton")));nl.addStretch(1);nl.addWidget(label(currentUser.email||"Gost"));nl.addWidget(button("Odjava",()=>{const previousMain=mainWindow;firebaseAuth.logout();authScreen();previousMain.close()},"navButton"));
 pages.forEach(p=>stack.addWidget(p.widget));root.setStyleSheet(css);mainWindow.setCentralWidget(root);refreshAll(pages);mainWindow.show();if(previous)previous.close();syncAll(pages)
}
const uid=()=>currentUser.localId;
function makeDashboard(){const w=new QWidget(),l=vbox(w,15);l.setContentsMargins(32,28,32,28);l.addWidget(label("Nadzorna ploča","title"));l.addWidget(label("Pregled vaših financija na jednom mjestu","muted"));const metrics=new QWidget(),ml=hbox(metrics,14),a=cardMetric("UKUPNO STANJE","0,00 €"),b=cardMetric("PRIHODI OVAJ MJESEC","0,00 €"),c=cardMetric("RASHODI OVAJ MJESEC","0,00 €");[a,b,c].forEach(x=>ml.addWidget(x.widget));l.addWidget(metrics);const recent=label("Još nema transakcija.","cardText"),card=new QWidget();card.setObjectName("card");vbox(card).addWidget(recent);l.addWidget(card);l.addStretch(1);return{widget:w,refresh(){const rows=localDb.all("transactions",uid()),s=summary(rows,new Date().toISOString().slice(0,7));a.valueLabel.setText(euro(s.balance));b.valueLabel.setText(euro(s.income));c.valueLabel.setText(euro(s.expense));recent.setText(rows.slice(0,8).map(x=>x.tx_date+"   "+(x.description||x.category)+"   "+(x.kind==="Prihod"?"+":"−")+euro(x.amount)).join("\n")||"Još nema transakcija.")}}}
function makeTransactions(){const w=new QWidget(),l=vbox(w,12);l.setContentsMargins(32,28,32,28);const top=new QWidget(),tl=hbox(top);tl.addWidget(label("Transakcije","title"));tl.addStretch(1);const table=new QTableWidget(0,6);table.setHorizontalHeaderLabels(["Datum","Opis","Kategorija","Račun","Vrsta","Iznos"]);tl.addWidget(button("+ Nova transakcija",()=>transactionDialog(page),"primary"));l.addWidget(top);l.addWidget(table);const page={widget:w,refresh(){const rows=localDb.all("transactions",uid());table.setRowCount(rows.length);rows.forEach((x,r)=>[x.tx_date,x.description,x.category,x.account,x.kind,(x.kind==="Prihod"?"+":"−")+euro(x.amount)].forEach((v,c)=>table.setItem(r,c,new QTableWidgetItem(String(v)))))}};return page}
function transactionDialog(page){const d=new QDialog();d.setWindowTitle("Nova transakcija");d.resize(430,470);const l=vbox(d,10);l.setContentsMargins(25,25,25,25);const type=new QComboBox();type.addItems(["Rashod","Prihod"]);const date=new QLineEdit();date.setText(new Date().toISOString().slice(0,10));const amount=new QLineEdit();amount.setPlaceholderText("Iznos");const category=new QComboBox();category.addItems(["Hrana","Stanovanje","Prijevoz","Zabava","Zdravlje","Ostalo","Plaća","Dodatni prihod"]);const account=new QComboBox();account.addItems(["Glavni račun","Gotovina"]);const desc=new QLineEdit();desc.setPlaceholderText("Opis");[type,date,amount,category,account,desc].forEach(x=>l.addWidget(x));l.addWidget(button("Spremi",async()=>{try{const row=validateTransaction({tx_date:date.text(),kind:type.currentText(),amount:amount.text().replace(",","."),category:category.currentText(),account:account.currentText(),description:desc.text()});const saved=localDb.put("transactions",uid(),row);page.refresh();d.accept();if(uid()!=="local-offline")try{await cloud.push("transactions",saved)}catch{}}catch(e){msg("Neispravan unos",e.message)}},"primary"));d.setStyleSheet(css);d.exec()}
function makeBudgets(){const w=new QWidget(),l=vbox(w,12);l.setContentsMargins(32,28,32,28);l.addWidget(label("Mjesečni budžeti","title"));const list=label("Još nema postavljenih budžeta.","cardText");const card=new QWidget();card.setObjectName("card");vbox(card).addWidget(list);l.addWidget(card);l.addStretch(1);return{widget:w,refresh(){const rows=localDb.all("budgets",uid());list.setText(rows.map(x=>x.month+"   "+x.category+"   "+euro(x.amount)).join("\n")||"Još nema postavljenih budžeta.")}}}
function makeSettings(){const w=new QWidget(),l=vbox(w,12);l.setContentsMargins(32,28,32,28);l.addWidget(label("Postavke","title"));l.addWidget(label("Lokalna baza: "+localDb.path,"muted"));l.addWidget(button("Sinkroniziraj sada",async()=>{if(uid()==="local-offline"){msg("Sinkronizacija","Lokalni način ne koristi Firebase. Prijavite se za sinkronizaciju.");return}try{for(const name of ["transactions","budgets","categories","accounts"])await cloud.sync(name);msg("Sinkronizacija","Podaci su uspješno sinkronizirani.")}catch(e){msg("Sinkronizacija",e.message)}},"primary"));l.addWidget(button("Izvezi transakcije u CSV",()=>{try{const dialog=new QFileDialog();dialog.setWindowTitle("Spremi CSV");dialog.setAcceptMode(AcceptMode.AcceptSave);dialog.setNameFilter("CSV (*.csv)");dialog.setDefaultSuffix("csv");if(dialog.exec()===DialogCode.Accepted){const file=dialog.selectedFiles()[0];if(file)fs.writeFileSync(file,"\ufeff"+csv(localDb.all("transactions",uid())),"utf8")}}catch(e){msg("Izvoz nije uspio",e.message)}}));l.addStretch(1);return{widget:w,refresh(){}}}
function refreshAll(pages){pages.forEach(p=>p.refresh())}
async function syncAll(pages){if(!config.ready||uid()==="local-offline")return;try{for(const n of["transactions","budgets","categories","accounts"])await cloud.sync(n);refreshAll(pages)}catch{}}
const restored=firebaseAuth.current();if(restored){currentUser=restored;openMain()}else authScreen();
// Qode runs Qt's event loop while a window remains open.

// Expressインスタンス生成
const express = require("express");
const app = express();

// User定義
const { PORT, log4jsConfig } = require("./config.js");
const mysqlHandler = require("./handlers/db/mysql.js");
const H = require("./handlers/index.js");

const path = require("path");
app.use("/static", express.static("./public"));

// テンプレートエンジン設定
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// BodyParser設定
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ファビコン設定
const favicon = require("serve-favicon");
app.use(favicon(`${__dirname}/public/images/favicon.ico`));

// CORS対策
const cors = require('cors');
app.use(cors());

// ログインセッション管理
const session = require("express-session");
app.use(session({
    secret: "your-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24時間
        httpOnly: true,              // JSから触れない（セキュリティ向上）
        secure: false                // HTTPSなら true に
    }
}));

// ロガー設定
const log4js = require("log4js");
log4js.configure(log4jsConfig);


// ログイン
const ADMIN_CODE = ["10794", "21292"];
app.post("/login", async (req, res) => {
    const { empnoinput } = req.body;
    const user = await mysqlHandler.getKM0010(empnoinput); // DB認証（パスワード認証なし）
    if (user.length == 0) return res.status(401).send("ログイン失敗");
    const role = ADMIN_CODE.includes(user[0].EMPNO) ? "admin" : "user";
    
    // セッションにユーザー情報を保存
    req.session.user = {
        empno: user[0].EMPNO,
        name: user[0].NAME,
        role: role
    };

    res.redirect("/"); // ログイン後トップへ
});
app.get("/logout", async (req, res) => {
    req.session.destroy();
    res.redirect("/");
});

// 共通処理
async function renderSchedule(base, req, res) {
    const monthlyThursdays = H.getMonthlyThursdays(base);
    const first = monthlyThursdays[0];
    const last = monthlyThursdays[monthlyThursdays.length - 1];
    const reservations = await mysqlHandler.getKD7000(first, last);

    res.render("schedule", {
        user: req.session.user ?? null,
        title: `${base.getMonth() + 1}月度`,
        prevmonth: H.d2str(H.getPrevMonth(base)),
        nextmonth: H.d2str(H.getNextMonth(base)),
        timeslots: H.getActiveTimeSlots(base),
        monthlyThursdays,
        reservations,
        d2mdw: H.d2mdw,
        findResv: (day, slot) => {
            return reservations.find(r =>
                r.RESERVDT.startsWith(day) && r.TIMESLOT === slot
            );
        }
    });
}

// Top Page
app.get("/", async (req, res) => {
    const base = H.getInitialMonth();
    await renderSchedule(base, req, res);
});

// 月度ページ
app.get("/ymd/:base", async (req, res) => {
    const [y, m, d] = req.params.base.split("-");
    const base = new Date(y, m - 1, d);
    await renderSchedule(base, req, res);
});

// 従業員一覧検索 API
app.get("/users", async (req, res) => {
    try {
        const result = await mysqlHandler.getKM0010();
        if (result.length == 0) {
            res.status(299).end();
        } else {
            res.status(200).json(result);
        }
    } catch (err) {
        next(err);
    }
});

// 従業員検索 API
app.get("/users/:empno", async (req, res) => {
    try {
        const result = await mysqlHandler.getKM0010(req.params.empno);
        if (result.length == 0) {
            res.status(299).end();
        } else {
            res.status(200).json(result);
        }
    } catch (err) {
        next(err);
    }
});

// からだや予約ファイル取得 API
// param: 月度を指定
app.get("/orders/:yyyymm", async (req, res, next) => {
    try {
        const result = await mysqlHandler.getKD7000(req.params.yyyymm);
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
});

// からだや予約ファイル登録または更新 API
// HTTPメソッド: POST
app.post("/api/reserve", async (req, res) => {
    const useragent = req.headers["user-agent"];
    const ip =
        req.headers["x-forwarded-for"]?.split(",")[0] ||
        req.socket.remoteAddress;
    const { reservdt, timeslot, stdt, eddt, empno, empnm, treatment, note } = req.body;
    try {
        await mysqlHandler.insupdateKD7000(reservdt, timeslot, stdt, eddt, empno, empnm, treatment, note, `[${ip}]${useragent}`);
        res.status(200).end();
    } catch (err) {
        const msg = "API登録メソッドで" + err;
        const logger = log4js.getLogger("e");
        logger.error(msg);
        res.status(299).end();
    }
});

// からだや予約ファイル削除 API
// HTTPメソッド: DELETE
app.delete('/orders', async (req, res) => {
    const { reservdt, timeslot } = req.body;
    try {
        await mysqlHandler.deleteKD7000(reservdt, timeslot);
        res.status(200).end();
    } catch (err) {
        res.status(299).end();
    }
});

// 包括的エラーハンドリング
app.use((err, req, res, next) => {
    console.log("包括的エラーハンドリング")
    console.error(err);
    res.status(500).send(`サーバーの動作が失敗しました．:${err.code} `);
});

// データベース接続 確証後にサーバーを起動
mysqlHandler.connect
.then(() => {
    console.log(`MySQL Database [${mysqlHandler.database}] Connected!`);
    app.listen(PORT, () => {console.log(`からだや予約システム listen on Port:${PORT}`)});
}).catch((err) => {
    console.log("MySQL Database Connection Error!");
    console.log(err);
});

const mysql = require('mysql2/promise');
const { mysqlConfig } = require('../../config.js');
const { decryptPassword } = require("../security/decrypt-password.js");
const decPasswd = decryptPassword(mysqlConfig.PASSWORD);

// MySQL接続情報
const connectionString = {
      host: mysqlConfig.HOST
    , port: mysqlConfig.PORT
    , database: mysqlConfig.DATABASE
    , user: mysqlConfig.USER
    , password: decPasswd
    , dateStrings: 'date' /*または'true'*/
};
exports.database = connectionString.database;

// コネクションプールの取得
const pool = mysql.createPool(connectionString);
const connect = pool.getConnection()
exports.connect = connect;


// Database から データを取得する
const getDatabase = async (sql, param) => {
    const conn = await pool.getConnection();
    const results = await conn.query(sql, param);
    conn.release();
    return JSON.parse(JSON.stringify(results[0]));;
};

// 従業員マスタ検索
exports.getKM0010 = async (empno) => {
    const hasEmpno = empno !== undefined && empno !== null;
    const sql = hasEmpno
        ? "select * from km0010 where EMPNO=?"
        : "select * from km0010 where ACTIVE='1'";
    const params = hasEmpno ? [empno] : [];
    return getDatabase(sql, params);
};

// からだや予約ファイル取得 API
// 月度をyyyymmで指定
exports.getKD7000 = async (first, last) => {
    const sql = 
        "select a.*, m.NAME from kd7000 a inner join km0010 m on m.EMPNO=a.EMPNO " +
        "where a.RESERVDT between ? and ? " + 
        "order by a.RESERVDT asc, a.TIMESLOT asc";
    return await getDatabase(sql, [first, last]);
};

// からだや予約ファイル - 登録または施術内容変更
exports.insupdateKD7000 = async (reservdt, timeslot, stdt, eddt, empno, empnm, treatment, note, useragent) => {
    const treatmentValue = treatment === '' ? null : treatment.trim();
    const noteValue = note === '' ? null : note.trim();
    const result = await getDatabase(
        "insert into kd7000 (RESERVDT, TIMESLOT, STDT, EDDT, EMPNO, EMPNM, TREATMENT, NOTE, USERAGENT, INSTDT) "
            + "values (?, ?, ?, ?, ?, ?, ?, ?, ?, now())"
            + "on duplicate key update "
            + "TREATMENT = values(TREATMENT), "
            + "NOTE = values(NOTE)"
            , [reservdt, timeslot, stdt, eddt, empno, empnm, treatmentValue, noteValue, useragent]
    );
};

// からだや予約ファイル - 予約取り消し
exports.deleteKD7000 = async (reservdt, timeslot) => {
    const result = await getDatabase(
        "delete from kd7000 where RESERVDT=? and TIMESLOT=?"
            , [reservdt, timeslot]
    );
};

// からだや予約ファイル - 予約済み確認
exports.checkReservedKD7000 = async (reservdt, timeslot, empno) => {
    const result = await getDatabase(
        "select EMPNO from kd7000 where RESERVDT=? and TIMESLOT=?"
            , [reservdt, timeslot]
    );
    // 予約なし || 自分の予約の場合 true ⇒ on duplicate key updateで更新
    const ret = (result.length == 0 || result[0].EMPNO == empno);
    return ret;
}

// 品目マスタ(M0500)存在チェック
exports.isM0500 = async (hmcd) => {
    const m0500 = await getDatabase("select HMCD from m0500 where HMCD=?", [hmcd]);
    return m0500.length == 0 ? false : true;
};

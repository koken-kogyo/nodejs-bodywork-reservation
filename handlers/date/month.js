const { d2str } = require('./format.js');

// 基準月を取得（例：2026-10-01）
function getInitialMonth() {
    const d = new Date();
    const year = d.getFullYear();
    const month = d.getMonth();
    const day = d.getDate();

    // 20日過ぎは翌月1日
    if (day > 20)
        return new Date(year, month + 1, 1);

    // 20日までの最終木曜を取得
    const lastThu = getLastThursdayUntil20(year, month);

    // 最終木曜の翌日〜20日なら翌月1日
    if (lastThu.getDate() < day)
        return new Date(year, month + 1, 1);

    // それ以外は当月1日
    return new Date(year, month, 1);
}

// 月度の木曜日一覧（前月21〜前月末 + 当月1〜20）
function getMonthlyThursdays(base) {
    const year = base.getFullYear();
    const month = base.getMonth();

    const prevLastDay = new Date(year, month, 0).getDate();

    const prevThursdays =
        getThursdaysInRange(year, month - 1, 21, prevLastDay);

    const thisThursdays =
        getThursdaysInRange(year, month, 1, 20);

    return [...prevThursdays, ...thisThursdays];
}

// 前月度
function getPrevMonth(base) {
    const prev = new Date(base.getFullYear(), base.getMonth() - 1, 1);
    return (prev);
}

// 翌月度
function getNextMonth(base) {
    const next = new Date(base.getFullYear(), base.getMonth() + 1, 1);
    return (next);
}


// 20日までの最終木曜日を O(1) で求める
function getLastThursdayUntil20(year, month) {
    // 20日を基準に曜日を取得
    const base = new Date(year, month, 20);
    const dow = base.getDay(); // 0=日曜〜6=土曜

    // 20日から木曜(4)まで戻る日数
    const diff = (dow >= 4)
        ? dow - 4
        : dow + 3; // 例: 月曜(1)なら 1+3=4日戻る

    // 20日以前で最終木曜を返す
    return new Date(year, month, 20 - diff);
}

// 指定範囲の木曜日をすべて返す
function getThursdaysInRange(year, month, startDay, endDay) {
    const result = [];

    const start = new Date(year, month, startDay);
    const dow = start.getDay(); // 0=日曜〜6=土曜
    const diff = (dow <= 4)
        ? 4 - dow
        : 7 - (dow - 4);
    let current = new Date(year, month, startDay + diff);

    while (current.getDate() <= endDay && current.getMonth() === month) {
        result.push(d2str(current));
        current = new Date(year, month, current.getDate() + 7);
    }
    return result;
}

module.exports = {
    getInitialMonth,
    getMonthlyThursdays,
    getPrevMonth,
    getNextMonth,
};

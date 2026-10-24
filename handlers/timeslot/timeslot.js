// タイムスロット定義（有効期限付き）
const TimeSlots = {
    "DEFAULT": [
        "① 16:20 ～ 16:50",
        "② 17:20 ～ 17:50",
        "③ 18:00 ～ 18:30",
        "④ 18:40 ～ 19:10",
        "⑤ 19:20 ～ 19:50"
    ],
    "202609": [
        "① 16:30 ～ 17:00",
        "② 16:50 ～ 17:20",
        "③ 17:30 ～ 18:00",
        "④ 18:10 ～ 18:40",
        "⑤ 18:50 ～ 19:20",
        "⑥ 19:30 ～ 20:00"
    ],
    "202711": [
        "① 16:20 ～ 16:50",
        "② 17:20 ～ 17:50",
        "③ 18:00 ～ 18:30",
        "④ 18:40 ～ 19:10",
        "⑤ 19:20 ～ 19:50"
    ],
    "209912": [
        "① 17:00 ～ 17:30",
        "② 17:20 ～ 17:50",
        "③ 18:00 ～ 18:30",
        "④ 18:40 ～ 19:10",
        "⑤ 19:20 ～ 19:50",
        "⑥ 20:00 ～ 20:30"
    ]
};

// 有効開始日（YYYYMM → タイムテーブル名）
const TimeSlotRules = [
    { from: "202609", name: "202609" },
    { from: "202711", name: "202711" },
    { from: "209912", name: "209912" }
];

// 現在日付から有効なタイムテーブルを取得
function getActiveTimeSlots(base) {
    const y = base.getFullYear();
    const m = String(base.getMonth() + 1).padStart(2, '0');
    const ym = `${y}${m}`; // YYYYMM

    // 有効開始日が現在年月以下のものを抽出
    const candidates = TimeSlotRules
        .filter(r => r.from <= ym)
        .sort((a, b) => b.from.localeCompare(a.from)); // 最新を先頭に

    // 該当があればそのタイムテーブルを返す
    if (candidates.length > 0) {
        return TimeSlots[candidates[0].name];
    }

    // なければデフォルト
    return TimeSlots["DEFAULT"];
}

// 開始日時取得
function getStartDateTime(reserveday, timeslot) {
    const slots = getActiveTimeSlots(reserveday);
    if (timeslot < 0 || timeslot >= slots.length) 
    {
        return new Date("2999-12-31");
    }
    // "① 16:20 ～ 16:50" → "16:20"
    const st = slots[timeslot].split(' ')[1];
    const [hour, minute] = st.split(':').map(Number);
    const d = new Date(reserveday)
    d.setHours(hour, minute, 0, 0);

    return d;
}

// timeslotが0または1の場合はdeadline==15:10を返却
// それ以外は開始日時の1時間前のdeadlineを返却
function getOneHourBeforeStartTime(reserveday, timeslot) {
    const d = getStartDateTime(reserveday, timeslot)
    if (reserveday >= new Date("2026-09-01") &&
        reserveday < new Date("2027-11-01") && 
        (timeslot == 0 || timeslot == 1))
    {
        d.setHours(15, 10, 0, 0);
    } else {
        d.setHours(d.getHours() - 1);
    }
    return d;
}

module.exports = { 
    getActiveTimeSlots
    , getStartDateTime
    , getOneHourBeforeStartTime
 };

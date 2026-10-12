/*
 * メイン処理（表示関連）
 */

/* お知らせ表示から予約画面遷移関連 */
let selectedDay = null;
let selectedSlot = null;
function openNotice(cell) {
    const day = cell.dataset.day;
    const slot = Number(cell.dataset.slot);
    selectedDay = day;
    selectedSlot = slot;
    document.getElementById("notice-modal").style.display = "block";
}
function closeNotice() {
    document.getElementById("notice-modal").style.display = "none";
}

/* おしらせからの予約画面 */
function openReserve() {
    closeNotice();
    const timeslots = getTimeslotsFromTable();
    document.getElementById("reserve-date").innerText = selectedDay.substring(0, 10);
    document.getElementById("reserve-timeslot-name").innerText = timeslots[selectedSlot];
    document.getElementById("reserve-timeslot").value = selectedSlot;
    document.getElementById("reserve-cancel-button").style.display = "none";
    document.getElementById("reserve-button").style.display = "block";
    document.getElementById("reserve-button").innerText = "予約";
    document.getElementById("reserve-modal").style.display = "block";
}

// スマホ版の場合はお知らせなしのダイレクト予約画面
function openReserveDirect(cell) {
    selectedDay = cell.dataset.day;
    selectedSlot = Number(cell.dataset.slot);
    openReserve();
}

/* 予約確認画面 */
function openDetail(cell) {
    const json = JSON.parse(cell.dataset.json);
    const timeslots = getTimeslotsFromTable();
    selectedDay = json.RESERVDT;
    selectedSlot = json.TIMESLOT;
    document.getElementById("reserve-date").innerText = json.RESERVDT.substring(0, 10);
    document.getElementById("reserve-timeslot-name").innerText = timeslots[json.TIMESLOT];
    const sel = document.getElementById("reserve-treatment");
    sel.value = json.TREATMENT; // 施術内容を初期選択する
    document.getElementById("reserve-note").innerText = json.NOTE ?? "";

    // 過去日判定
    const today = new Date();
    const resvDate = new Date(json.RESERVDT);
    const isPast = resvDate < today;

    // 過去日はロックする
    const treatment = document.getElementById("reserve-treatment");
    const note = document.getElementById("reserve-note");

    if (isPast) {
        treatment.disabled = true;   // セレクトボックスをロック
        note.readOnly = true;        // テキストエリアをロック（disabledでもOK）
        note.style.background = "#eee"; // ロック感を出す（任意）
        document.getElementById("reserve-cancel-button").style.display = "none";
        document.getElementById("reserve-button").style.display = "none";
    } else {
        treatment.disabled = false;
        note.readOnly = false;
        note.style.background = ""; 
        document.getElementById("reserve-cancel-button").style.display = "block";
        document.getElementById("reserve-button").style.display = "block";
        document.getElementById("reserve-button").innerText = "変更";
    }
    document.getElementById("reserve-modal").style.display = "block";
}

/* 予約画面を閉じる */
function closeReserve() {
    document.getElementById("reserve-modal").style.display = "none";
}

// PCテーブルの <tbody><th> から timeslots を再構築
function getTimeslotsFromTable() {
    const rows = document.querySelectorAll(".schedule-table tbody tr");
    const list = [];

    rows.forEach(row => {
        const firstCell = row.querySelector("th");
        if (firstCell) {
            list.push(firstCell.innerText.trim());
        }
    });
    return list;
}




/*
 * イベントリスナー関連
 */

/* 従業員番号入力 */
let isComposing = false; // IME全角入力の未確定状態かそれ以外かを判定
const empInput = document.getElementById("empnoinput");
if (empInput) {
    empInput.addEventListener("compositionstart", () => {isComposing = true;});
    empInput.addEventListener("compositionend", () => {
        isComposing = false;
        inputChange();
    });
}
// 従業員番号入力ボックスのChangeイベント
async function inputChange() {
    try {
        if (isComposing) return; // 全角入力中は処理を行わない
        // 全角英数字を半角に変換
        const str = empInput.value.toUpperCase().replace(/[Ａ-Ｚａ-ｚ０-９]/g, function(s) {
            return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
        });
        if ((str.startsWith('0') && str.length != 6) ||
            (!str.startsWith('0') && str.length != 5)) return; // 従業員番号の入力途中の場合は処理を行わない
        if (empInput.value != str) empInput.value = str;
        // ログインAPI呼び出し
        const res = await fetch("/login", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({empnoinput: str})
        });
        if (res.ok) {
            location.href = "/";
        } else {
            empInput.focus();
            empInput.select();
            alert("\n従業員番号を確認してください．\n");
        }
    } catch (e) {
        alert("異常が発生しました。\n通信状況等をご確認ください。"); // ネットワークエラー（サーバに届いていない）
    }
}

/* スマホ版のスワイプ対応 */
let touchStartX = 0;
let touchEndX = 0;
const spwrapper = document.getElementById("sp-wrapper");
if (spwrapper) {
    spwrapper.addEventListener("touchstart", e => {
        touchStartX = e.changedTouches[0].screenX;
    });
    spwrapper.addEventListener("touchend", e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });
}
function handleSwipe() {
    const diff = touchEndX - touchStartX;
    if (Math.abs(diff) < 100) return; // スワイプ閾値（px）
    if (diff > 0) {
        // → 右スワイプ → 前月へ
        const prevmonth = document.getElementById("prevmonth").value;
        spwrapper.classList.add("slide-right");
        setTimeout(() => location.href = `/ymd/${prevmonth}`, 300);
    } else {
        // → 左スワイプ → 翌月へ
        const nextmonth = document.getElementById("nextmonth").value;
        spwrapper.classList.add("slide-left");
        setTimeout(() => location.href = `/ymd/${nextmonth}`, 300);
    }
}




/*
 * メイン処理（登録関連）
 */

// 予約
async function reserve() {
    try {
        const timeslots = getTimeslotsFromTable();
        const body = {
            reservdt: selectedDay,
            timeslot: selectedSlot,
            stdt: getStartTimeStr(selectedDay, timeslots[selectedSlot]),
            eddt: getEndTimeStr(selectedDay, timeslots[selectedSlot]),
            empno: document.getElementById('reserve-empno').value,
            empnm: document.getElementById('reserve-name').value,
            treatment: document.getElementById("reserve-treatment").value,
            note: document.getElementById("reserve-note").value
        };
        // サーバーの登録API呼び出し
        const res = await fetch("/api/reserve", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(body)
        });
        if (res.ok) {
            closeReserve();
            addReservedDOM(body);
            const action = (document.getElementById("reserve-button").innerText == "予約") ? "予約" : "変更"; // 予約 or 変更
            await sendScreenshotByEMail(action, body);
        } else {
            const err = await res.json();
            alert("予約に失敗しました．\n" + err.msg);
        }
        location.reload();
    } catch (e) {
        alert("異常が発生しました。\n通信状況等をご確認ください。"); // ネットワークエラー（サーバに届いていない）
    }
}
function addReservedDOM(body) {
    const {reservdt, timeslot, empno} = body;
    // 呼び出し画面判定（PC版.cell）（スマホ版.slot-card）
    const isSp = spwrapper && window.getComputedStyle(spwrapper).display !== "none";
    const classname = (isSp) ? ".slot-card" : ".cell";
    const obj = document.querySelector(
        `${classname}.empty[data-day="${reservdt.substring(0, 10)}"][data-slot="${timeslot}"]`
    );
    if (obj) {
        const isFullTimeEmployee = (
            empno.startsWith('1') || empno.startsWith('2') ||
            empno.startsWith("01") || empno.startsWith("02"));
        obj.classList.add((isFullTimeEmployee) ? "reserved-fulltime" : "reserved-other");
        obj.classList.add("mine");
        if (isSp) {
            const timeslots = getTimeslotsFromTable();
            obj.innerHTML = `<div class="slot-time">${timeslots[timeslot]}（予約済み）</div>`;
        } else {
            obj.innerText = "済";
        }
    }
}

// 予約日とスロット名から開始時刻を取得
function getStartTimeStr(selectedDay, slotname) {
    const day = selectedDay.split(" ")[0];  // "2026-10-15 00:00:00" → "2026-10-15"
    const parts = slotname.split(" ");      // "① 16:30 ～ 17:00"
    const startTime = parts[1];             // "16:30"
    return `${day} ${startTime}`;           // "2026-10-15 16:30"
}

// 予約日とスロット名から終了時刻を取得
function getEndTimeStr(selectedDay, slotname) {
    const day = selectedDay.split(" ")[0];
    const parts = slotname.split(" ");
    const endTime = parts[3];               // "17:00"
    return `${day} ${endTime}`;             // "2026-10-15 17:00"
}

// 予約取り消し
async function reserveCancel() {
    try {
        if (!confirm("\n本当に予約を取消しますか？\n")) return;
        const timeslots = getTimeslotsFromTable();
        const body = {
            reservdt: selectedDay,
            timeslot: selectedSlot,
            stdt: getStartTimeStr(selectedDay, timeslots[selectedSlot]),
            eddt: getEndTimeStr(selectedDay, timeslots[selectedSlot]),
            empno: document.getElementById('reserve-empno').value,
            empnm: document.getElementById('reserve-name').value,
            treatment: document.getElementById("reserve-treatment").value,
            note: document.getElementById("reserve-note").value
        };
        // サーバーの削除API呼び出し
        const res = await fetch('/api/reserveCancel', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (res.ok) {
            closeReserve();
            clearReservedDOM(body); 
            await sendScreenshotByEMail("取消", body);
        } else {
            const err = await res.json();
            alert("予約取消に失敗しました．\n" + err.msg);
        }
        location.reload();
    } catch (e) {
        alert("異常が発生しました。\n通信状況等をご確認ください。"); // ネットワークエラー（サーバに届いていない）
    }
};
function clearReservedDOM(body) {
    const {reservdt, timeslot} = body;
    // 呼び出し画面判定（PC版.cell）（スマホ版.slot-card）
    const isSp = spwrapper && window.getComputedStyle(spwrapper).display !== "none";
    const classname = (isSp) ? ".slot-card" : ".cell";
    const obj = document.querySelector(
        `${classname}.mine[data-json*="${reservdt}"][data-json*="${timeslot}"]`
    );
    if (obj) {
        obj.classList.remove("reserved-fulltime", "reserved-other", "mine");
        obj.classList.add("empty");
        if (isSp) {
            const timeslots = getTimeslotsFromTable();
            obj.innerHTML = `<div class="slot-time">${timeslots[timeslot]}</div>`;
        } else {
            obj.innerText = "";
        }
    }
}



/*
 * メール送信関連
 */

/* 本文～
action:"予約":新規予約が登録されました．
action:"取消":予約が取消されました．
action:"変更":予約内容が変更されました．

日時：{order.ReservDt:yyyy/MM/dd} {order.StDt:HH:mm} ～ {order.EdDt:HH:mm}
社員番号：{order.EmpNo}
氏名：{order.EmpName}
施術内容：{order.Treatment}
備考：{order.Note}";

-------------------------------------------------------------
※このメールはプログラムが自動送信したものです。
　返信は出来ません．
-------------------------------------------------------------
*/

// メール送信API呼び出し
async function sendScreenshotByEMail(action, body) {
    // スクリーンショット
    const isSP = window.getComputedStyle(document.getElementById("sp-wrapper")).display !== "none";
    let target;
    if (isSP) {
        // （おまけ）変更された枠に赤枠を設定
        const changedSlot = document.querySelector(
            `.slot-card[data-day="${body.reservdt.substring(0,10)}"][data-slot="${body.timeslot}"]`
        );
        if (changedSlot) changedSlot.classList.add("slot-highlight");

        // スマホ版は予約日から親の day-card を検索してスクショ
        // （png画像サイズが500KBになってしまった為、切り取ってjpeg化して60KBまで減った）
        const slot = document.querySelector(`.slot-card[data-day="${body.reservdt.substring(0, 10)}"]`);
        target = slot.closest(".day-card");
    } else {
        // （おまけ）変更された枠に赤枠を設定
        const changedSlot = document.querySelector(
            `.cell[data-day="${body.reservdt.substring(0,10)}"][data-slot="${body.timeslot}"]`
        );
        if (changedSlot) changedSlot.classList.add("slot-highlight");

        // PC版はそのままでも56KB(jpeg化)
        target = document.getElementById("pc-wrapper");
    }
    // ここで少し待って（CSS反映待ち）・・・うまくいかんかった時間があれば検証
    await new Promise(resolve => setTimeout(resolve, 300));
    // その後キャンバスを取得する
    const canvas = await html2canvas(target);
    const screenshot = canvas.toDataURL("image/jpeg", 0.8);
    // メッセージ作成
    const ttl = (action=="予約") ? "新規予約が登録されました．"
        : (action=="取消") ? "予約が取消されました．"
        : (action=="変更") ? "予約内容が変更されました．" : action;
    const rdt = dayjs(body.reservdt).format("YYYY/MM/DD");
    const sdt = dayjs(body.stdt).format("HH:mm");
    const edt = dayjs(body.eddt).format("HH:mm");
    const msg = `
${ttl}

日時：${rdt} ${sdt} ～ ${edt}
社員番号：${body.empno}
氏名：${body.empnm}
施術内容：${body.treatment}
備考：${body.note}

--------------------------------------------------------------------------------------
※このメールはプログラムが自動送信したものです。
　返信は出来ません．
--------------------------------------------------------------------------------------
`;
    // 送信依頼
    await fetch("/api/sendmail", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({msg, screenshot})
    });
}

// テストスタブ
function ScreenshotTest() {
    const body = {
        reservdt: "2026-10-25 00:00:00",
        timeslot: "5",
        stdt: "2026-10-25 15:30",
        eddt: "2026-10-25 16:00",
        empno: "11014",
        empnm: "渡辺善行",
        treatment: "せじゅつないよう",
        note: "テストスタブからの送信"
    };
    sendScreenshotByEMail("取消", body);
    return;
    const element = document.body;
    html2canvas(element).then(canvas => {
        // Append the canvas to the body
        document.body.appendChild(canvas);

        // Optionally save the image
        const link = document.createElement('a');
        link.download = 'screenshot.png';
        link.href = canvas.toDataURL();
        link.click();
    }).catch(err => {
        console.error("Screenshot failed:", err);
    });
}
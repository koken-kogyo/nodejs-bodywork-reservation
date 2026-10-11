let selectedDay = null;
let selectedSlot = null;

/* お知らせ表示 */
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



// 予約
async function reserve() {
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
    const res = await fetch("/api/reserve", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body)
    });
    if (res.ok) {
        closeReserve();
        location.reload();
    } else {
        alert("予約に失敗しました。");
    }
}

// 予約日とスロット名から開始時刻を取得
function getStartTimeStr(selectedDay, slotname) {
    const day = selectedDay.split(" ")[0];  // "2026-10-15 00:00:00" → "2026-10-15"
    const parts = slotname.split(" ");      // ["①", "16:30", "～", "17:00"]
    const startTime = parts[1];             // "16:30"
    return `${day} ${startTime}`;
}

// 予約日とスロット名から終了時刻を取得
function getEndTimeStr(selectedDay, slotname) {
    const day = selectedDay.split(" ")[0];
    const parts = slotname.split(" ");
    const endTime = parts[3];               // "17:00"
    return `${day} ${endTime}`;
}

// 予約取り消し
async function reserveCancel() {
    const reservdt = document.getElementById('reservdt').value;
    const timeslot = document.getElementById('timeslot').value;
    const res = await fetch('/orders', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservdt, timeslot })
    });
    if (res.ok)
    {
        loadList();
    }
    else
    {
        document.getElementById('list').innerText = "データの更新に失敗しました。";
    }
};

// yyyy-MM-dd 形式にフォーマット
function d2str(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// m/d(曜日) 形式にフォーマット
function d2mdw(str) {
    const d = new Date(str);
    const m = d.getMonth() + 1;
    const day = d.getDate();
    const w = ["日","月","火","水","木","金","土"][d.getDay()];
    return `${m}/${day}(${w})`;
}

module.exports = {
    d2str,
    d2mdw
};

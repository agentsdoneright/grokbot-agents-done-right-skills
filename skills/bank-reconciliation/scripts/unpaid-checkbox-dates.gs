/**
 * Container-bound Apps Script for reconciliation Summary unpaid tables.
 * Install on the native Google Sheet (xlsx cannot embed this).
 *
 * When Paid is checked/unchecked: set/clear Date Paid from Config!B1.
 * When Reminder Sent is checked/unchecked: set/clear Date Reminder Sent from Config!B1.
 * Date cells are static values — never formulas.
 */
function onEdit(e) {
  if (!e || !e.range) return;
  var sheet = e.range.getSheet();
  if (sheet.getName() !== 'Summary') return;
  if (e.range.getNumRows() !== 1 || e.range.getNumColumns() !== 1) return;

  var row = e.range.getRow();
  var col = e.range.getColumn();
  if (row < 2) return;

  var headerRow = findUnpaidHeaderRow_(sheet, row);
  if (!headerRow) return;

  var headers = sheet.getRange(headerRow, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  var headerMap = {};
  for (var i = 0; i < headers.length; i++) {
    var h = String(headers[i] || '').trim().toLowerCase();
    if (h) headerMap[h] = i + 1;
  }

  var stampDate = getConfigToday_();
  var editedHeader = String(headers[col - 1] || '').trim().toLowerCase();
  var checked = isTruthy_(e.value);

  if (editedHeader === 'paid' && headerMap['date paid']) {
    var datePaidCell = sheet.getRange(row, headerMap['date paid']);
    if (checked) {
      datePaidCell.setValue(stampDate);
    } else {
      datePaidCell.clearContent();
    }
    return;
  }

  if (editedHeader === 'reminder sent' && headerMap['date reminder sent']) {
    var dateRemCell = sheet.getRange(row, headerMap['date reminder sent']);
    if (checked) {
      dateRemCell.setValue(stampDate);
    } else {
      dateRemCell.clearContent();
    }
  }
}

/** Walk up from the edited row to find an Unpaid Expense/Revenue header row. */
function findUnpaidHeaderRow_(sheet, editedRow) {
  var maxLook = Math.min(editedRow - 1, 80);
  for (var r = editedRow - 1; r >= Math.max(1, editedRow - maxLook); r--) {
    var rowVals = sheet.getRange(r, 1, 1, Math.max(9, sheet.getLastColumn())).getDisplayValues()[0];
    var joined = rowVals.map(function (v) { return String(v || '').trim().toLowerCase(); }).join(' | ');
    var hasDate = rowVals.some(function (v) { return String(v || '').trim().toLowerCase() === 'date'; });
    var hasPaid = rowVals.some(function (v) { return String(v || '').trim().toLowerCase() === 'paid'; });
    var hasReminder = rowVals.some(function (v) { return String(v || '').trim().toLowerCase() === 'reminder sent'; });
    var titleAbove = r > 1 ? String(sheet.getRange(r - 1, 1).getDisplayValue() || '').toLowerCase() : '';
    var unpaidTitle = titleAbove.indexOf('unpaid') !== -1;
    if (hasDate && (hasPaid || hasReminder) && (unpaidTitle || joined.indexOf('status') !== -1)) {
      return r;
    }
  }
  return null;
}

function getConfigToday_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var config = ss.getSheetByName('Config');
  if (config) {
    var v = config.getRange('B1').getValue();
    if (v instanceof Date && !isNaN(v.getTime())) return v;
    if (typeof v === 'number' && isFinite(v)) {
      // Sheets serial date
      var epoch = new Date(Date.UTC(1899, 11, 30));
      return new Date(epoch.getTime() + v * 86400000);
    }
  }
  var now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function isTruthy_(value) {
  if (value === true || value === 'TRUE' || value === 'true') return true;
  if (value === false || value === 'FALSE' || value === 'false' || value === '' || value == null) return false;
  return Boolean(value);
}

/**
 * Container-bound Apps Script for reconciliation Summary unpaid tables.
 * Install on the native Google Sheet (xlsx cannot embed this).
 *
 * When Paid is checked/unchecked: set/clear Date Paid; when checked, clear Note;
 *   rewrite Status formula so checked → "paid" (old formulas showed "pending").
 * When Reminder Sent is checked/unchecked: set/clear Date Reminder Sent;
 *   rewrite revenue Status formula (Reminder Sent → grace pending → unpaid).
 * Stamp date = Config!B1 (Today) when that cell is set; otherwise the current calendar date
 * in the **spreadsheet** timezone (not the script-editor session).
 * Date Paid / Date Reminder Sent are static values — never TODAY() formulas.
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

  var stampDate = getConfigToday_(); // yyyy-MM-dd string in spreadsheet timezone
  var editedHeader = String(headers[col - 1] || '').trim().toLowerCase();
  var checked = isTruthy_(e.value);

  if (editedHeader === 'paid' && headerMap['date paid']) {
    var datePaidCell = sheet.getRange(row, headerMap['date paid']);
    if (checked) {
      datePaidCell.setValue(stampDate);
    } else {
      datePaidCell.clearContent();
    }
    ensureExpenseStatusFormula_(sheet, row, headerMap);
    return;
  }

  if (editedHeader === 'reminder sent' && headerMap['date reminder sent']) {
    var dateRemCell = sheet.getRange(row, headerMap['date reminder sent']);
    if (checked) {
      dateRemCell.setValue(stampDate);
    } else {
      dateRemCell.clearContent();
    }
    ensureRevenueStatusFormula_(sheet, row, headerMap);
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

/** Today for NETWORKDAYS: Config!$B$1 when set, otherwise TODAY(). */
function configTodayRef_() {
  return 'IF(OR(Config!$B$1="",Config!$B$1=0),TODAY(),Config!$B$1)';
}

/** Paid checkbox → "paid"; else grace pending; else unpaid. Uses Config!$B$2 expense grace. */
function ensureExpenseStatusFormula_(sheet, row, headerMap) {
  if (!headerMap['status'] || !headerMap['date'] || !headerMap['paid']) return;
  var dateRef = colToA1_(headerMap['date']) + row;
  var paidRef = colToA1_(headerMap['paid']) + row;
  var todayRef = configTodayRef_();
  var formula = '=IF(' + paidRef + ',"paid",IF(NETWORKDAYS(' + dateRef +
    ',' + todayRef + ')-1<Config!$B$2,"pending","unpaid"))';
  sheet.getRange(row, headerMap['status']).setFormula(formula);
}

/** Reminder Sent → "Reminder Sent"; else grace pending; else unpaid. Uses Config!$B$3. */
function ensureRevenueStatusFormula_(sheet, row, headerMap) {
  if (!headerMap['status'] || !headerMap['date'] || !headerMap['reminder sent']) return;
  var dateRef = colToA1_(headerMap['date']) + row;
  var remRef = colToA1_(headerMap['reminder sent']) + row;
  var todayRef = configTodayRef_();
  var formula = '=IF(' + remRef + ',"Reminder Sent",IF(NETWORKDAYS(' + dateRef +
    ',' + todayRef + ')-1<Config!$B$3,"pending","unpaid"))';
  sheet.getRange(row, headerMap['status']).setFormula(formula);
}

function colToA1_(col) {
  var s = '';
  var n = col;
  while (n > 0) {
    var m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/**
 * Config!B1 when set; otherwise today — as `yyyy-MM-dd` in the **spreadsheet** timezone.
 * Returning a string avoids Date midnight shifting a day when script TZ ≠ sheet TZ
 * (Debug in the editor often matches your session; simple onEdit from a checkbox does not).
 */
function getConfigToday_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tz = ss.getSpreadsheetTimeZone() || Session.getScriptTimeZone();
  var config = ss.getSheetByName('Config');
  if (config) {
    var v = config.getRange('B1').getValue();
    if (v !== '' && v != null) {
      if (v instanceof Date && !isNaN(v.getTime())) {
        return Utilities.formatDate(v, tz, 'yyyy-MM-dd');
      }
      if (typeof v === 'number' && isFinite(v) && v !== 0) {
        var epoch = new Date(Date.UTC(1899, 11, 30));
        return Utilities.formatDate(new Date(epoch.getTime() + v * 86400000), tz, 'yyyy-MM-dd');
      }
      if (typeof v === 'string' && v.trim()) {
        var parsed = new Date(v.trim());
        if (!isNaN(parsed.getTime())) {
          return Utilities.formatDate(parsed, tz, 'yyyy-MM-dd');
        }
      }
    }
  }
  return Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
}

function isTruthy_(value) {
  if (value === true || value === 'TRUE' || value === 'true') return true;
  if (value === false || value === 'FALSE' || value === 'false' || value === '' || value == null) return false;
  return Boolean(value);
}

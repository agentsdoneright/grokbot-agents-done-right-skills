/**
 * Unpaid Expense / Unpaid Revenue checkbox handlers for the reconciliation Summary tab.
 * Invoked from summary-on-edit.gs → onEdit (do not define onEdit in this file).
 *
 * When Paid is checked/unchecked: set/clear Date Paid; when checked, clear Note;
 *   rewrite Status formula so checked → "paid" (old formulas showed "pending").
 * When Reminder Sent is checked/unchecked: set/clear Date Reminder Sent;
 *   rewrite revenue Status formula (Reminder Sent → grace pending → unpaid).
 * Stamp date = Config!B1 (Today) when that cell is set; otherwise the current calendar date
 * in the **spreadsheet** timezone (not the script-editor session).
 * Date Paid / Date Reminder Sent are real dates with number format d-mmm (e.g. 10-Nov) —
 * never TODAY() formulas.
 */
function handleUnpaidCheckboxEdit_(e) {
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

  var stampYmd = getConfigTodayYmd_(); // yyyy-MM-dd in spreadsheet timezone
  var editedHeader = String(headers[col - 1] || '').trim().toLowerCase();
  var checked = isTruthy_(e.value);

  if (editedHeader === 'paid' && headerMap['date paid']) {
    var datePaidCell = sheet.getRange(row, headerMap['date paid']);
    if (checked) {
      setDateDmmm_(datePaidCell, stampYmd);
      if (headerMap['note']) {
        sheet.getRange(row, headerMap['note']).clearContent();
      }
    } else {
      datePaidCell.clearContent();
    }
    ensureExpenseStatusFormula_(sheet, row, headerMap);
    return;
  }

  if (editedHeader === 'reminder sent' && headerMap['date reminder sent']) {
    var dateRemCell = sheet.getRange(row, headerMap['date reminder sent']);
    if (checked) {
      setDateDmmm_(dateRemCell, stampYmd);
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

/** Write a real date from yyyy-MM-dd and format display as d-mmm (e.g. 10-Nov). */
function setDateDmmm_(cell, ymd) {
  var parts = String(ymd).split('-');
  var y = Number(parts[0]);
  var m = Number(parts[1]) - 1;
  var d = Number(parts[2]);
  // Noon local avoids midnight timezone rollbacks when setValue runs from onEdit
  cell.setValue(new Date(y, m, d, 12, 0, 0));
  cell.setNumberFormat('d-mmm');
}

/**
 * Config!B1 when set; otherwise today — as `yyyy-MM-dd` in the **spreadsheet** timezone.
 * (Used internally; cells are written via setDateDmmm_ as real dates with d-mmm format.)
 */
function getConfigTodayYmd_() {
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

/**
 * Debugger entry: simulate ticking Paid on the first Unpaid Expense data row.
 * Select this function → Debug (set breakpoints in handleUnpaidCheckboxEdit_ / setDateDmmm_).
 */
function debugPaidClick() {
  debugUnpaidCheckbox_('expense', true);
}

/**
 * Debugger entry: simulate ticking Reminder Sent on the first Unpaid Revenue data row.
 * Select this function → Debug (set breakpoints in handleUnpaidCheckboxEdit_ / setDateDmmm_).
 */
function debugReminderSentClick() {
  debugUnpaidCheckbox_('revenue', true);
}

/**
 * Find the unpaid table checkbox cell and call handleUnpaidCheckboxEdit_ with a fake edit event.
 * @param {'expense'|'revenue'} table
 * @param {boolean} checked  simulate check (true) or uncheck (false)
 */
function debugUnpaidCheckbox_(table, checked) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Summary');
  if (!sheet) {
    throw new Error('Summary sheet not found');
  }

  var titleNeedle = table === 'revenue' ? 'unpaid revenue' : 'unpaid expense';
  var checkboxHeader = table === 'revenue' ? 'reminder sent' : 'paid';
  var found = findUnpaidCheckboxCell_(sheet, titleNeedle, checkboxHeader);
  if (!found) {
    throw new Error(
      'No ' + checkboxHeader + ' checkbox found under "' + titleNeedle +
      '". Add at least one data row, then Debug again.'
    );
  }

  var cell = found.cell;
  var oldValue = cell.getValue();
  cell.setValue(checked); // mirror a real checkbox edit before the handler runs
  var e = {
    range: cell,
    value: checked,
    oldValue: oldValue,
    source: ss,
    user: Session.getActiveUser()
  };
  Logger.log(
    'debugUnpaidCheckbox_ ' + table + ' → ' + cell.getA1Notation() +
    ' checked=' + checked + ' stampYmd=' + getConfigTodayYmd_()
  );
  handleUnpaidCheckboxEdit_(e);
}

/**
 * Locate title row → header row → first non-empty data row → checkbox column.
 * @return {{cell: GoogleAppsScript.Spreadsheet.Range, headerRow: number, dataRow: number}|null}
 */
function findUnpaidCheckboxCell_(sheet, titleNeedle, checkboxHeader) {
  var lastRow = Math.max(sheet.getLastRow(), 1);
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var titleRow = null;
  for (var r = 1; r <= lastRow; r++) {
    var a1 = String(sheet.getRange(r, 1).getDisplayValue() || '').trim().toLowerCase();
    if (a1.indexOf(titleNeedle) !== -1) {
      titleRow = r;
      break;
    }
  }
  if (!titleRow) return null;

  var headerRow = titleRow + 1;
  var headers = sheet.getRange(headerRow, 1, 1, lastCol).getDisplayValues()[0];
  var checkboxCol = 0;
  for (var c = 0; c < headers.length; c++) {
    if (String(headers[c] || '').trim().toLowerCase() === checkboxHeader) {
      checkboxCol = c + 1;
      break;
    }
  }
  if (!checkboxCol) return null;

  // First data row under the header that has any value in Date..Amount-ish cols
  for (var dataRow = headerRow + 1; dataRow <= lastRow; dataRow++) {
    var rowLabel = String(sheet.getRange(dataRow, 1).getDisplayValue() || '').trim().toLowerCase();
    // Stop at next unpaid block or blank gap before the other table
    if (rowLabel.indexOf('unpaid ') === 0) break;
    var hasContent = false;
    for (var col = 1; col <= Math.min(5, lastCol); col++) {
      var v = sheet.getRange(dataRow, col).getValue();
      if (v !== '' && v != null) {
        hasContent = true;
        break;
      }
    }
    if (!hasContent) {
      // blank gap row — stop scanning this table
      break;
    }
    return {
      cell: sheet.getRange(dataRow, checkboxCol),
      headerRow: headerRow,
      dataRow: dataRow
    };
  }
  return null;
}

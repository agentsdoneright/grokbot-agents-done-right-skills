/**
 * Missing Expense Invoices → Personal Expense checkbox handler.
 * Invoked from summary-on-edit.gs → onEdit (do not define onEdit in this file).
 *
 * When Personal Expense is checked: set the matching Bank Transactions Debit
 * Category to "Personal", seed Categories if needed, clear light-red highlight.
 * When unchecked: leave Bank Category unchanged.
 *
 * Reuses isTruthy_ from unpaid-checkbox-dates.gs (same bound project).
 */

var PERSONAL_CATEGORY_ = 'Personal';
var MISSING_HIGHLIGHT_ = '#FFCDD2';

function handlePersonalExpenseEdit_(e) {
  if (!e || !e.range) return;
  var sheet = e.range.getSheet();
  if (sheet.getName() !== 'Summary') return;
  if (e.range.getNumRows() !== 1 || e.range.getNumColumns() !== 1) return;

  var row = e.range.getRow();
  var col = e.range.getColumn();
  if (row < 2) return;

  var headerRow = findMissingExpenseHeaderRow_(sheet, row);
  if (!headerRow) return;

  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var headers = sheet.getRange(headerRow, 1, 1, lastCol).getDisplayValues()[0];
  var headerMap = {};
  for (var i = 0; i < headers.length; i++) {
    var h = String(headers[i] || '').trim().toLowerCase();
    if (h) headerMap[h] = i + 1;
  }

  var editedHeader = String(headers[col - 1] || '').trim().toLowerCase();
  if (editedHeader !== 'personal expense') return;
  if (!headerMap['date'] || !headerMap['counterparty'] || !headerMap['amount']) {
    Logger.log('handlePersonalExpenseEdit_: Missing Expense headers incomplete');
    return;
  }

  // Uncheck: leave Bank Category as-is
  if (!isTruthy_(e.value)) return;

  var dateVal = sheet.getRange(row, headerMap['date']).getValue();
  var counterparty = String(sheet.getRange(row, headerMap['counterparty']).getDisplayValue() || '').trim();
  var amount = Number(sheet.getRange(row, headerMap['amount']).getValue());
  if (!counterparty || !isFinite(amount)) {
    Logger.log('handlePersonalExpenseEdit_: incomplete Summary row ' + row);
    return;
  }

  var bank = findBankDebitMatch_(dateVal, counterparty, amount);
  if (!bank) {
    Logger.log(
      'handlePersonalExpenseEdit_: no unique Bank Debit match for ' +
      counterparty + ' / ' + amount + ' on row ' + row
    );
    return;
  }

  bank.sheet.getRange(bank.row, bank.categoryCol).setValue(PERSONAL_CATEGORY_);
  ensurePersonalCategoryRow_();
  clearMissingHighlight_(bank.sheet, bank.row, bank.lastReconCol);
}

/** Walk up to the Missing Expense Invoices header row. */
function findMissingExpenseHeaderRow_(sheet, editedRow) {
  var maxLook = Math.min(editedRow - 1, 80);
  for (var r = editedRow - 1; r >= Math.max(1, editedRow - maxLook); r--) {
    var rowVals = sheet.getRange(r, 1, 1, Math.max(6, sheet.getLastColumn())).getDisplayValues()[0];
    var hasDate = rowVals.some(function (v) { return String(v || '').trim().toLowerCase() === 'date'; });
    var hasPersonal = rowVals.some(function (v) {
      return String(v || '').trim().toLowerCase() === 'personal expense';
    });
    var titleAbove = r > 1 ? String(sheet.getRange(r - 1, 1).getDisplayValue() || '').toLowerCase() : '';
    if (hasDate && hasPersonal && titleAbove.indexOf('missing expense') !== -1) {
      return r;
    }
  }
  return null;
}

/**
 * Find Bank Transactions Debit matching date + counterparty + amount.
 * @return {{sheet: GoogleAppsScript.Spreadsheet.Sheet, row: number, categoryCol: number, lastReconCol: number}|null}
 */
function findBankDebitMatch_(dateVal, counterparty, amount) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Bank Transactions');
  if (!sheet) {
    var sheets = ss.getSheets();
    for (var s = 0; s < sheets.length; s++) {
      var probe = sheets[s].getRange(1, 1, Math.min(5, sheets[s].getLastRow() || 1), Math.min(10, sheets[s].getLastColumn() || 1)).getDisplayValues();
      var flat = probe.map(function (row) {
        return row.map(function (c) { return String(c || '').trim().toLowerCase(); }).join('|');
      }).join('||');
      if (flat.indexOf('counterparty') !== -1 && flat.indexOf('debit') !== -1) {
        sheet = sheets[s];
        break;
      }
    }
  }
  if (!sheet) return null;

  var tz = ss.getSpreadsheetTimeZone() || Session.getScriptTimeZone();
  var targetYmd = dateToYmd_(dateVal, tz);
  if (!targetYmd) return null;

  var lastRow = sheet.getLastRow();
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  if (lastRow < 2) return null;

  // Locate header row by column names (title row may sit above)
  var headerRow = 0;
  var map = {};
  for (var hr = 1; hr <= Math.min(5, lastRow); hr++) {
    var headers = sheet.getRange(hr, 1, 1, lastCol).getDisplayValues()[0];
    var trial = {};
    for (var c = 0; c < headers.length; c++) {
      var key = String(headers[c] || '').trim().toLowerCase();
      if (key) trial[key] = c + 1;
    }
    if (trial['date'] && trial['counterparty'] && trial['category'] && trial['debit']) {
      headerRow = hr;
      map = trial;
      break;
    }
  }
  if (!headerRow) return null;

  var matches = [];
  for (var r = headerRow + 1; r <= lastRow; r++) {
    var debit = Number(sheet.getRange(r, map['debit']).getValue());
    if (!isFinite(debit) || debit === 0) continue;
    if (Math.abs(debit - amount) > 0.01) continue;
    var cp = String(sheet.getRange(r, map['counterparty']).getDisplayValue() || '').trim();
    if (cp.toLowerCase() !== counterparty.toLowerCase()) continue;
    var ymd = dateToYmd_(sheet.getRange(r, map['date']).getValue(), tz);
    if (ymd !== targetYmd) continue;
    matches.push(r);
  }

  if (matches.length !== 1) return null;

  var lastReconCol = map['source'] || map['notes'] || map['invoice'] || map['category'];
  return {
    sheet: sheet,
    row: matches[0],
    categoryCol: map['category'],
    lastReconCol: lastReconCol
  };
}

function dateToYmd_(value, tz) {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, tz, 'yyyy-MM-dd');
  }
  if (typeof value === 'number' && isFinite(value) && value !== 0) {
    var epoch = new Date(Date.UTC(1899, 11, 30));
    return Utilities.formatDate(new Date(epoch.getTime() + value * 86400000), tz, 'yyyy-MM-dd');
  }
  if (typeof value === 'string' && value.trim()) {
    var parsed = new Date(value.trim());
    if (!isNaN(parsed.getTime())) {
      return Utilities.formatDate(parsed, tz, 'yyyy-MM-dd');
    }
  }
  return null;
}

function ensurePersonalCategoryRow_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var cat = ss.getSheetByName('Categories');
  if (!cat) return;
  var lastRow = Math.max(cat.getLastRow(), 1);
  var lastCol = Math.max(cat.getLastColumn(), 2);
  var headers = cat.getRange(1, 1, 1, lastCol).getDisplayValues()[0];
  var catCol = 1;
  var typeCol = 0;
  for (var c = 0; c < headers.length; c++) {
    var h = String(headers[c] || '').trim().toLowerCase();
    if (h === 'category') catCol = c + 1;
    if (h === 'type') typeCol = c + 1;
  }
  var startRow = String(headers[catCol - 1] || '').trim().toLowerCase() === 'category' ? 2 : 1;
  for (var r = startRow; r <= lastRow; r++) {
    var name = String(cat.getRange(r, catCol).getDisplayValue() || '').trim();
    if (name.toLowerCase() === PERSONAL_CATEGORY_.toLowerCase()) return;
  }
  var newRow = Math.max(lastRow + 1, startRow);
  cat.getRange(newRow, catCol).setValue(PERSONAL_CATEGORY_);
  if (typeCol) {
    cat.getRange(newRow, typeCol).setValue('Expense');
  }
}

function clearMissingHighlight_(sheet, row, lastReconCol) {
  if (!lastReconCol || lastReconCol < 1) return;
  var range = sheet.getRange(row, 1, 1, lastReconCol);
  var backgrounds = range.getBackgrounds()[0];
  var needsClear = false;
  for (var i = 0; i < backgrounds.length; i++) {
    if (String(backgrounds[i] || '').toUpperCase() === MISSING_HIGHLIGHT_.toUpperCase()) {
      needsClear = true;
      break;
    }
  }
  if (needsClear) {
    range.setBackground(null);
  }
}

/**
 * Debugger entry: simulate ticking Personal Expense on the first Missing Expense data row.
 * Select this function → Debug (set breakpoints in handlePersonalExpenseEdit_).
 */
function debugPersonalExpenseClick() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Summary');
  if (!sheet) {
    throw new Error('Summary sheet not found');
  }

  var found = findPersonalExpenseCheckboxCell_(sheet);
  if (!found) {
    throw new Error(
      'No Personal Expense checkbox found under Missing Expense Invoices. ' +
      'Add at least one data row, then Debug again.'
    );
  }

  var cell = found.cell;
  var oldValue = cell.getValue();
  cell.setValue(true);
  var e = {
    range: cell,
    value: true,
    oldValue: oldValue,
    source: ss,
    user: Session.getActiveUser()
  };
  Logger.log('debugPersonalExpenseClick → ' + cell.getA1Notation());
  handlePersonalExpenseEdit_(e);
}

function findPersonalExpenseCheckboxCell_(sheet) {
  var lastRow = Math.max(sheet.getLastRow(), 1);
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var titleRow = null;
  for (var r = 1; r <= lastRow; r++) {
    var a1 = String(sheet.getRange(r, 1).getDisplayValue() || '').trim().toLowerCase();
    if (a1.indexOf('missing expense') !== -1) {
      titleRow = r;
      break;
    }
  }
  if (!titleRow) return null;

  var headerRow = titleRow + 1;
  var headers = sheet.getRange(headerRow, 1, 1, lastCol).getDisplayValues()[0];
  var checkboxCol = 0;
  for (var c = 0; c < headers.length; c++) {
    if (String(headers[c] || '').trim().toLowerCase() === 'personal expense') {
      checkboxCol = c + 1;
      break;
    }
  }
  if (!checkboxCol) return null;

  for (var dataRow = headerRow + 1; dataRow <= lastRow; dataRow++) {
    var rowLabel = String(sheet.getRange(dataRow, 1).getDisplayValue() || '').trim().toLowerCase();
    if (rowLabel.indexOf('missing ') === 0 || rowLabel.indexOf('unpaid ') === 0) break;
    var hasContent = false;
    for (var col = 1; col <= Math.min(3, lastCol); col++) {
      var v = sheet.getRange(dataRow, col).getValue();
      if (v !== '' && v != null) {
        hasContent = true;
        break;
      }
    }
    if (!hasContent) break;
    return {
      cell: sheet.getRange(dataRow, checkboxCol),
      headerRow: headerRow,
      dataRow: dataRow
    };
  }
  return null;
}

/**
 * Missing Expense / Missing Revenue → No Invoice Needed checkbox handler.
 * Invoked from summary-on-edit.gs → onEdit (do not define onEdit in this file).
 *
 * When No Invoice Needed is checked: find the matching Bank Transactions Debit
 * (expense table) or Credit (revenue table), then set that Category's
 * Invoice Required = FALSE on the Categories tab.
 * Prefer Summary Category column when present; else Bank Category.
 * When unchecked: leave Invoice Required unchanged.
 *
 * Reuses isTruthy_ from unpaid-checkbox-dates.gs (same bound project).
 */

var MISSING_HIGHLIGHT_NIN_ = '#FFCDD2';

function handleNoInvoiceNeededEdit_(e) {
  if (!e || !e.range) return;
  var sheet = e.range.getSheet();
  if (sheet.getName() !== 'Summary') return;
  if (e.range.getNumRows() !== 1 || e.range.getNumColumns() !== 1) return;

  var row = e.range.getRow();
  var col = e.range.getColumn();
  if (row < 2) return;

  var found = findMissingNoInvoiceHeader_(sheet, row);
  if (!found) return;
  var headerRow = found.headerRow;
  var side = found.side; // 'expense' | 'revenue'

  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var headers = sheet.getRange(headerRow, 1, 1, lastCol).getDisplayValues()[0];
  var headerMap = {};
  for (var i = 0; i < headers.length; i++) {
    var h = String(headers[i] || '').trim().toLowerCase();
    if (h) headerMap[h] = i + 1;
  }

  var editedHeader = String(headers[col - 1] || '').trim().toLowerCase();
  if (editedHeader !== 'no invoice needed') return;
  if (!headerMap['date'] || !headerMap['counterparty'] || !headerMap['amount']) {
    Logger.log('handleNoInvoiceNeededEdit_: Missing ' + side + ' headers incomplete');
    return;
  }

  // Uncheck: leave Categories.Invoice Required as-is
  if (!isTruthy_(e.value)) return;

  var dateVal = sheet.getRange(row, headerMap['date']).getValue();
  var counterparty = String(sheet.getRange(row, headerMap['counterparty']).getDisplayValue() || '').trim();
  var amount = Number(sheet.getRange(row, headerMap['amount']).getValue());
  if (!counterparty || !isFinite(amount)) {
    Logger.log('handleNoInvoiceNeededEdit_: incomplete Summary row ' + row);
    return;
  }

  var summaryCategory = '';
  if (headerMap['category']) {
    summaryCategory = String(sheet.getRange(row, headerMap['category']).getDisplayValue() || '').trim();
  }

  var bank = findBankSideMatchNin_(dateVal, counterparty, amount, side === 'expense' ? 'debit' : 'credit');
  if (!bank) {
    Logger.log(
      'handleNoInvoiceNeededEdit_: no unique Bank ' +
      (side === 'expense' ? 'Debit' : 'Credit') +
      ' match for ' + counterparty + ' / ' + amount + ' on row ' + row
    );
    return;
  }

  var categoryName = summaryCategory;
  if (!categoryName) {
    categoryName = String(
      bank.sheet.getRange(bank.row, bank.categoryCol).getDisplayValue() || ''
    ).trim();
  }
  if (!categoryName) {
    Logger.log('handleNoInvoiceNeededEdit_: blank Category for row ' + row);
    return;
  }

  var defaultType = side === 'expense' ? 'Expense' : 'Revenue';
  setCategoryInvoiceRequiredFalse_(categoryName, defaultType);
  clearMissingHighlightNin_(bank.sheet, bank.row, bank.lastReconCol);
}

/**
 * Walk up to Missing Expense or Missing Revenue header that includes No Invoice Needed.
 * @return {{headerRow: number, side: 'expense'|'revenue'}|null}
 */
function findMissingNoInvoiceHeader_(sheet, editedRow) {
  var maxLook = Math.min(editedRow - 1, 80);
  for (var r = editedRow - 1; r >= Math.max(1, editedRow - maxLook); r--) {
    var rowVals = sheet.getRange(r, 1, 1, Math.max(8, sheet.getLastColumn())).getDisplayValues()[0];
    var hasDate = rowVals.some(function (v) { return String(v || '').trim().toLowerCase() === 'date'; });
    var hasNoInv = rowVals.some(function (v) {
      return String(v || '').trim().toLowerCase() === 'no invoice needed';
    });
    if (!hasDate || !hasNoInv) continue;
    var titleAbove = r > 1 ? String(sheet.getRange(r - 1, 1).getDisplayValue() || '').toLowerCase() : '';
    if (titleAbove.indexOf('missing expense') !== -1) {
      return { headerRow: r, side: 'expense' };
    }
    if (titleAbove.indexOf('missing revenue') !== -1) {
      return { headerRow: r, side: 'revenue' };
    }
  }
  return null;
}

/**
 * Find Bank Transactions Debit or Credit matching date + counterparty + amount.
 * @param {'debit'|'credit'} amountSide
 * @return {{sheet: GoogleAppsScript.Spreadsheet.Sheet, row: number, categoryCol: number, lastReconCol: number}|null}
 */
function findBankSideMatchNin_(dateVal, counterparty, amount, amountSide) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Bank Transactions');
  if (!sheet) {
    var sheets = ss.getSheets();
    for (var s = 0; s < sheets.length; s++) {
      var probe = sheets[s].getRange(1, 1, Math.min(5, sheets[s].getLastRow() || 1), Math.min(10, sheets[s].getLastColumn() || 1)).getDisplayValues();
      var flat = probe.map(function (row) {
        return row.map(function (c) { return String(c || '').trim().toLowerCase(); }).join('|');
      }).join('||');
      if (flat.indexOf('counterparty') !== -1 && flat.indexOf(amountSide) !== -1) {
        sheet = sheets[s];
        break;
      }
    }
  }
  if (!sheet) return null;

  var tz = ss.getSpreadsheetTimeZone() || Session.getScriptTimeZone();
  var targetYmd = dateToYmdNin_(dateVal, tz);
  if (!targetYmd) return null;

  var lastRow = sheet.getLastRow();
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  if (lastRow < 2) return null;

  var headerRow = 0;
  var map = {};
  for (var hr = 1; hr <= Math.min(5, lastRow); hr++) {
    var headers = sheet.getRange(hr, 1, 1, lastCol).getDisplayValues()[0];
    var trial = {};
    for (var c = 0; c < headers.length; c++) {
      var key = String(headers[c] || '').trim().toLowerCase();
      if (key) trial[key] = c + 1;
    }
    if (trial['date'] && trial['counterparty'] && trial['category'] && trial[amountSide]) {
      headerRow = hr;
      map = trial;
      break;
    }
  }
  if (!headerRow) return null;

  var matches = [];
  for (var r = headerRow + 1; r <= lastRow; r++) {
    var amt = Number(sheet.getRange(r, map[amountSide]).getValue());
    if (!isFinite(amt) || amt === 0) continue;
    if (Math.abs(amt - amount) > 0.01) continue;
    var cp = String(sheet.getRange(r, map['counterparty']).getDisplayValue() || '').trim();
    if (cp.toLowerCase() !== counterparty.toLowerCase()) continue;
    var ymd = dateToYmdNin_(sheet.getRange(r, map['date']).getValue(), tz);
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

function dateToYmdNin_(value, tz) {
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

/**
 * Set Invoice Required = FALSE for categoryName; create row if missing.
 * @param {string} defaultType 'Expense' or 'Revenue' when creating a new Categories row
 */
function setCategoryInvoiceRequiredFalse_(categoryName, defaultType) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var cat = ss.getSheetByName('Categories');
  if (!cat) {
    Logger.log('setCategoryInvoiceRequiredFalse_: Categories sheet missing');
    return;
  }

  var lastRow = Math.max(cat.getLastRow(), 1);
  var lastCol = Math.max(cat.getLastColumn(), 3);
  var headers = cat.getRange(1, 1, 1, lastCol).getDisplayValues()[0];
  var catCol = 1;
  var typeCol = 0;
  var invReqCol = 0;
  for (var c = 0; c < headers.length; c++) {
    var h = String(headers[c] || '').trim().toLowerCase();
    if (h === 'category') catCol = c + 1;
    if (h === 'type') typeCol = c + 1;
    if (h === 'invoice required') invReqCol = c + 1;
  }

  if (!invReqCol) {
    invReqCol = lastCol + 1;
    cat.getRange(1, invReqCol).setValue('Invoice Required');
  }

  var startRow = String(headers[catCol - 1] || '').trim().toLowerCase() === 'category' ? 2 : 1;
  for (var r = startRow; r <= lastRow; r++) {
    var name = String(cat.getRange(r, catCol).getDisplayValue() || '').trim();
    if (name.toLowerCase() === categoryName.toLowerCase()) {
      cat.getRange(r, invReqCol).insertCheckboxes();
      cat.getRange(r, invReqCol).setValue(false);
      return;
    }
  }

  var newRow = Math.max(lastRow + 1, startRow);
  cat.getRange(newRow, catCol).setValue(categoryName);
  if (typeCol) {
    cat.getRange(newRow, typeCol).setValue(defaultType || 'Expense');
  }
  cat.getRange(newRow, invReqCol).insertCheckboxes();
  cat.getRange(newRow, invReqCol).setValue(false);
}

function clearMissingHighlightNin_(sheet, row, lastReconCol) {
  if (!lastReconCol || lastReconCol < 1) return;
  var range = sheet.getRange(row, 1, 1, lastReconCol);
  var backgrounds = range.getBackgrounds()[0];
  var needsClear = false;
  for (var i = 0; i < backgrounds.length; i++) {
    if (String(backgrounds[i] || '').toUpperCase() === MISSING_HIGHLIGHT_NIN_.toUpperCase()) {
      needsClear = true;
      break;
    }
  }
  if (needsClear) {
    range.setBackground(null);
  }
}

/**
 * Debugger entry: first Missing Expense or Missing Revenue No Invoice Needed checkbox.
 */
function debugNoInvoiceNeededClick() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Summary');
  if (!sheet) {
    throw new Error('Summary sheet not found');
  }

  var found = findNoInvoiceNeededCheckboxCell_(sheet, 'missing expense') ||
    findNoInvoiceNeededCheckboxCell_(sheet, 'missing revenue');
  if (!found) {
    throw new Error(
      'No No Invoice Needed checkbox found under Missing Expense or Missing Revenue. ' +
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
  Logger.log('debugNoInvoiceNeededClick → ' + cell.getA1Notation());
  handleNoInvoiceNeededEdit_(e);
}

function findNoInvoiceNeededCheckboxCell_(sheet, titleNeedle) {
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
    if (String(headers[c] || '').trim().toLowerCase() === 'no invoice needed') {
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

/**
 * ============================================================================
 * PRERAB OS — АВТОМАТИЧЕСКИЙ ПРИЕМ ФАКТУР С ПОЧТЫ (Gmail -> Prerab OS)
 * ============================================================================
 *
 * Что делает скрипт:
 *   1. Раз в 15 минут просматривает почту фирмы и находит письма с фактурами
 *      от магазинов и поставщиков (Hornbach, OBI, SIKO, Slovnaft, Stavebniny...).
 *   2. Сохраняет PDF фактуры в папку на Google Drive.
 *   3. Отправляет письмо в Prerab OS, где система сама распознает поставщика,
 *      номер фактуры, VS, IBAN, сумму и СРОК ОПЛАТЫ.
 *   4. Помечает письмо ярлыком, чтобы одна фактура не завелась дважды.
 *
 * КАК ПОДКЛЮЧИТЬ (5 минут, делается один раз):
 *   1. Зайдите на https://script.google.com под почтой фирмы -> «Новый проект».
 *   2. Вставьте сюда весь этот файл и сохраните (иконка дискеты).
 *   3. В блоке CONFIG ниже укажите адрес вашего приложения (API_URL).
 *   4. Сверху выберите функцию "nastavitAutomatiku" и нажмите «Выполнить».
 *      Google спросит разрешения — разрешите доступ к Gmail и Drive.
 *   5. Готово: фактуры сами появятся в разделе «Фактуры на уплату».
 *   6. ВАЖНО: слева «Службы» (Services) -> «+» -> «Drive API» -> Добавить.
 *      Ваши поставщики (SIKO, Stavebniny DEK, MAX Parket, MARCUS TRADE)
 *      присылают пустое письмо, а сумму и срок оплаты пишут только внутри
 *      PDF. Без этой службы фактура заведется с нулевой суммой.
 *
 * Проверить вручную: выберите функцию "spracovatFaktury" и нажмите «Выполнить»,
 * затем откройте «Просмотр -> Журнал выполнения».
 * ============================================================================
 */

var CONFIG = {
  // Адрес вашего приложения Prerab OS (Vercel) + /api/invoices-email
  API_URL: 'https://prerab-os.vercel.app/api/invoices-email',

  // Секретный ключ. Оставьте пустым, если переменная INVOICE_INBOX_SECRET
  // не задана в настройках Vercel.
  SECRET: '',

  // Поисковый запрос Gmail: какие письма считать фактурами.
  // Можно сузить до конкретных отправителей, например:
  // 'newer_than:30d from:(hornbach.sk OR obi.sk OR siko.sk)'
  GMAIL_QUERY: 'newer_than:30d (subject:faktura OR subject:faktúra OR subject:fakturu OR subject:faktúru OR subject:faktúry OR subject:invoice OR subject:"na úhradu" OR subject:"na uhradu" OR subject:"daňový doklad" OR subject:"danovy doklad" OR filename:faktura OR filename:faktúra OR filename:invoice)',

  // Читать текст из PDF вложения (нужно, когда в письме пусто, а вся
  // фактура внутри PDF). Работает, если подключена служба Drive API —
  // см. пункт 6 инструкции. Без нее скрипт просто работает без чтения PDF.
  EXTRACT_PDF_TEXT: true,

  // Ярлык, которым помечаются уже обработанные письма
  PROCESSED_LABEL: 'Prerab OS/Фактура принята',

  // Папка на Google Drive для PDF фактур (создается автоматически)
  DRIVE_FOLDER: 'Prerab OS — Фактуры на уплату',

  // Сколько писем обрабатывать за один запуск
  MAX_THREADS: 25,
};

/**
 * Главная функция: просматривает почту и отправляет новые фактуры в Prerab OS.
 */
function spracovatFaktury() {
  var label = ziskatLabel_(CONFIG.PROCESSED_LABEL);
  var folder = ziskatFolder_(CONFIG.DRIVE_FOLDER);

  var query = CONFIG.GMAIL_QUERY + ' -label:"' + CONFIG.PROCESSED_LABEL + '"';
  var threads = GmailApp.search(query, 0, CONFIG.MAX_THREADS);

  if (threads.length === 0) {
    Logger.log('Новых писем с фактурами нет.');
    return;
  }

  var payload = [];
  var spracovaneVlakna = [];

  threads.forEach(function (thread) {
    thread.getMessages().forEach(function (message) {
      var attachmentUrl = '';
      var attachmentName = '';

      // Сохраняем первое вложение PDF / изображение на Google Drive
      var attachmentText = '';
      var attachments = message.getAttachments({ includeInlineImages: false });
      for (var i = 0; i < attachments.length; i++) {
        var att = attachments[i];
        var type = att.getContentType() || '';
        if (type.indexOf('pdf') >= 0 || type.indexOf('image') >= 0) {
          try {
            var file = folder.createFile(att.copyBlob());
            file.setName(att.getName());
            file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
            attachmentUrl = file.getUrl();
            attachmentName = att.getName();
          } catch (e) {
            Logger.log('Не удалось сохранить вложение: ' + e);
          }

          // Читаем текст самой фактуры из PDF — там всегда есть сумма и срок оплаты
          if (CONFIG.EXTRACT_PDF_TEXT) {
            attachmentText = precitatTextZPrilohy_(att);
          }
          break;
        }
      }

      payload.push({
        from: message.getFrom(),
        subject: message.getSubject(),
        body: message.getPlainBody(),
        html: message.getBody(),
        received_at: message.getDate().toISOString(),
        message_id: message.getId(),
        thread_id: thread.getId(),
        attachment_name: attachmentName,
        attachment_url: attachmentUrl,
        attachment_text: attachmentText,
      });
    });

    spracovaneVlakna.push(thread);
  });

  if (payload.length === 0) {
    Logger.log('Писем для отправки нет.');
    return;
  }

  var body = { emails: payload };
  if (CONFIG.SECRET) body.secret = CONFIG.SECRET;

  var headers = { 'Content-Type': 'application/json' };
  if (CONFIG.SECRET) headers['x-prerab-secret'] = CONFIG.SECRET;

  var response = UrlFetchApp.fetch(CONFIG.API_URL, {
    method: 'post',
    contentType: 'application/json',
    headers: headers,
    payload: JSON.stringify(body),
    muteHttpExceptions: true,
  });

  var code = response.getResponseCode();
  Logger.log('Ответ Prerab OS (' + code + '): ' + response.getContentText());

  // Помечаем письма обработанными только при успешной отправке
  if (code >= 200 && code < 300) {
    spracovaneVlakna.forEach(function (thread) {
      thread.addLabel(label);
    });
    Logger.log('Отправлено писем: ' + payload.length);
  } else {
    Logger.log('ОШИБКА отправки. Письма НЕ помечены — попробуем при следующем запуске.');
  }
}

/**
 * Разовая настройка: включает автоматический запуск каждые 15 минут.
 */
function nastavitAutomatiku() {
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === 'spracovatFaktury') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp.newTrigger('spracovatFaktury')
    .timeBased()
    .everyMinutes(15)
    .create();

  ziskatLabel_(CONFIG.PROCESSED_LABEL);
  ziskatFolder_(CONFIG.DRIVE_FOLDER);

  Logger.log('Готово! Фактуры будут приходить в Prerab OS каждые 15 минут.');
  spracovatFaktury();
}

/**
 * Выключить автоматический прием фактур.
 */
function vypnutAutomatiku() {
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === 'spracovatFaktury') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  Logger.log('Автоматический прием фактур выключен.');
}

/**
 * Проверка связи с приложением Prerab OS.
 */
function skontrolovatSpojenie() {
  var response = UrlFetchApp.fetch(CONFIG.API_URL, { method: 'get', muteHttpExceptions: true });
  Logger.log('Статус: ' + response.getResponseCode() + ' | ' + response.getContentText());
}

// -------------------- служебные функции --------------------

function ziskatLabel_(name) {
  var label = GmailApp.getUserLabelByName(name);
  if (!label) label = GmailApp.createLabel(name);
  return label;
}

/**
 * Достает текст из PDF или фото фактуры через распознавание Google.
 * Если служба Drive API не подключена — молча возвращает пустую строку,
 * и фактура все равно заведется (по данным из письма).
 */
function precitatTextZPrilohy_(attachment) {
  try {
    if (typeof Drive === 'undefined' || !Drive.Files) return '';

    var docId = '';
    var blob = attachment.copyBlob();

    if (Drive.Files.create) {
      // Drive API v3
      var created = Drive.Files.create(
        { name: 'prerab-ocr-' + Date.now(), mimeType: 'application/vnd.google-apps.document' },
        blob,
        { ocrLanguage: 'sk' }
      );
      docId = created.id;
    } else {
      // Drive API v2
      var inserted = Drive.Files.insert(
        { title: 'prerab-ocr-' + Date.now(), mimeType: 'application/vnd.google-apps.document' },
        blob,
        { ocr: true, ocrLanguage: 'sk', convert: true }
      );
      docId = inserted.id;
    }

    if (!docId) return '';

    var text = DocumentApp.openById(docId).getBody().getText();
    DriveApp.getFileById(docId).setTrashed(true);
    return (text || '').substring(0, 15000);
  } catch (e) {
    Logger.log('Чтение PDF пропущено (служба Drive API не подключена): ' + e);
    return '';
  }
}

function ziskatFolder_(name) {
  var folders = DriveApp.getFoldersByName(name);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(name);
}

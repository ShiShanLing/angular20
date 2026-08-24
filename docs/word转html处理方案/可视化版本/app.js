'use strict';

(function () {
  function byId(id) { return document.getElementById(id); }

  var tabs = {
    word: { button: byId('wordTab'), panel: byId('wordPanel') },
    encode: { button: byId('encodeTab'), panel: byId('encodePanel') },
    decode: { button: byId('decodeTab'), panel: byId('decodePanel') }
  };

  var htmlInput = byId('htmlInput');
  var workspaceFolderButton = byId('workspaceFolderButton');
  var workspaceFolderName = byId('workspaceFolderName');
  var workspaceFolderHint = byId('workspaceFolderHint');
  var workspaceFolderAction = byId('workspaceFolderAction');
  var workspaceHtmlSelect = byId('workspaceHtmlSelect');
  var htmlDropZone = byId('htmlDropZone');
  var htmlBrowseAction = byId('htmlBrowseAction');
  var selectedHtmlName = byId('selectedHtmlName');
  var outputBaseName = byId('outputBaseName');
  var outputNamePreview = byId('outputNamePreview');
  var resetButton = byId('resetButton');
  var convertButton = byId('convertButton');
  var convertButtonLabel = byId('convertButtonLabel');
  var notice = byId('notice');
  var resultPanel = byId('resultPanel');
  var downloadHtmlButton = byId('downloadHtmlButton');
  var downloadTxtButton = byId('downloadTxtButton');
  var copyHtmlButton = byId('copyHtmlButton');
  var copyTxtButton = byId('copyTxtButton');
  var htmlSaveLabel = byId('htmlSaveLabel');
  var txtSaveLabel = byId('txtSaveLabel');
  var htmlFileSaveStatus = byId('htmlFileSaveStatus');
  var txtFileSaveStatus = byId('txtFileSaveStatus');
  var editHtmlButton = byId('editHtmlButton');
  var htmlDownloadName = byId('htmlDownloadName');
  var txtDownloadName = byId('txtDownloadName');
  var metrics = byId('metrics');
  var checks = byId('checks');
  var serverStatus = byId('serverStatus');

  var encodeInput = byId('encodeInput');
  var encodeEditor = byId('encodeEditor');
  var encodeResetButton = byId('encodeResetButton');
  var encodeButton = byId('encodeButton');
  var encodeButtonLabel = byId('encodeButtonLabel');
  var encodeNotice = byId('encodeNotice');
  var encodeResult = byId('encodeResult');
  var encodeDownloadButton = byId('encodeDownloadButton');
  var encodeCopyButton = byId('encodeCopyButton');
  var encodeDownloadName = byId('encodeDownloadName');
  var encodeChecks = byId('encodeChecks');
  var openDecodeButton = byId('openDecodeButton');

  var decodeInput = byId('decodeInput');
  var decodeEditor = byId('decodeEditor');
  var decodeResetButton = byId('decodeResetButton');
  var decodeButton = byId('decodeButton');
  var decodeButtonLabel = byId('decodeButtonLabel');
  var decodeNotice = byId('decodeNotice');
  var decodeResult = byId('decodeResult');
  var decodeDownloadButton = byId('decodeDownloadButton');
  var decodeCopyButton = byId('decodeCopyButton');
  var decodeDownloadName = byId('decodeDownloadName');
  var decodeChecks = byId('decodeChecks');

  var selectedHtml = null;
  var workspaceDirectoryHandle = null;
  var workspaceHtmlHandles = {};
  var nativeWorkspaceId = null;
  var nativeWorkspaceFiles = {};
  var wordOutputDirectoryHandle = null;
  var wordNativeWorkspaceId = null;
  var encodeOutputDirectoryHandle = null;
  var encodeNativeWorkspaceId = null;
  var decodeOutputDirectoryHandle = null;
  var decodeNativeWorkspaceId = null;
  var latestWordResult = null;
  var latestEncodeResult = null;
  var latestDecodeResult = null;
  var encodeSourceName = '编辑后的正文.html';
  var decodeSourceName = '转码文本.txt';

  var checkLabels = {
    json_parse: 'JSON 可解析', exact_decode: '逐字符还原', core_data_safe: 'core-data 安全',
    nested_core_data_safe: '两层 core-data 安全', font_family_settings_absent: '字体家族设置已移除',
    word_list_rules_absent: 'Word 列表残留已移除',
    css_comments_absent: 'CSS 注释已移除',
    style_line_breaks_absent: '样式声明已整理为单行',
    line_breaks_absent: 'HTML 源码已整理为单行',
    legal_permission_present: '正文容器有效', visible_text_preserved: '可见文字保留',
    inline_styles_preserved: '非字体内联样式保留', document_shell_absent: '文档外壳移除',
    images_absent: '图片引用已移除', clickable_links_absent: '链接不可点击',
    top_level_string: '顶层为字符串', exact_reencode: '重新编码一致'
  };

  function activateTab(name) {
    Object.keys(tabs).forEach(function (key) {
      var active = key === name;
      tabs[key].button.classList.toggle('is-active', active);
      tabs[key].button.setAttribute('aria-selected', String(active));
      tabs[key].panel.classList.toggle('is-active', active);
      tabs[key].panel.hidden = !active;
    });
    tabs[name].button.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  Object.keys(tabs).forEach(function (name) {
    tabs[name].button.addEventListener('click', function () { activateTab(name); });
  });

  function setNotice(element, message, kind) {
    element.textContent = message;
    element.className = 'notice ' + kind;
    element.hidden = false;
  }

  function clearNotice(element) {
    element.hidden = true;
    element.textContent = '';
    element.className = 'notice';
  }

  function setFileSaveStatus(element, message, kind) {
    element.textContent = message;
    element.className = 'file-save-status ' + kind;
    element.hidden = false;
  }

  function clearFileSaveStatus(element) {
    element.hidden = true;
    element.textContent = '';
    element.className = 'file-save-status';
  }

  function clearWordFileSaveStatuses() {
    clearFileSaveStatus(htmlFileSaveStatus);
    clearFileSaveStatus(txtFileSaveStatus);
  }

  function renderChecks(element, report) {
    element.innerHTML = Object.keys(report.checks).map(function (key) {
      return '<span class="check">✓ ' + (checkLabels[key] || key) + '</span>';
    }).join('');
  }

  function isHtmlFile(file) { return file && /\.html?$/i.test(file.name); }

  function sourceBaseName(filename) {
    return String(filename || '').replace(/\.html?$/i, '') || '转换结果';
  }

  function outputBaseNameError(value) {
    var name = String(value || '').trim();
    if (!name) return '生成文件名称不能为空。';
    if (name.length > 120) return '生成文件名称不能超过 120 个字符。';
    if (/[\\/:*?"<>|\u0000-\u001f]/.test(name)) return '名称不能包含 \\ / : * ? " < > | 等字符。';
    if (/^[.]+$/.test(name) || /[. ]$/.test(name)) return '名称不能只包含句点，也不能以句点或空格结尾。';
    if (/\.(?:html?|txt)$/i.test(name)) return '请只填写基础名称，不需要输入 .html、.htm 或 .txt 扩展名。';
    return '';
  }

  function updateOutputNamePreview() {
    var name = String(outputBaseName.value || '').trim();
    var error = outputBaseNameError(name);
    outputBaseName.classList.toggle('is-invalid', Boolean(error));
    outputNamePreview.classList.toggle('error', Boolean(error));
    outputNamePreview.textContent = error || ('将生成：' + name + '_legal_permission.html 和 ' + name + '_转码+转义.txt');
    convertButton.disabled = !selectedHtml || Boolean(error);
    return error;
  }

  function updateWordSelection() {
    if (!selectedHtml) {
      resetButton.hidden = true;
      updateOutputNamePreview();
      return;
    }
    resetButton.hidden = false;
    updateOutputNamePreview();
  }

  function setHtmlPickerBrowseMode(enabled) {
    htmlDropZone.classList.toggle('is-browse-mode', enabled);
    if (enabled) {
      htmlDropZone.setAttribute('role', 'button');
      htmlDropZone.setAttribute('tabindex', '0');
      htmlDropZone.setAttribute('aria-label', '选择 Word HTML 文件');
    } else {
      htmlDropZone.removeAttribute('role');
      htmlDropZone.removeAttribute('tabindex');
      htmlDropZone.removeAttribute('aria-label');
    }
  }

  function clearWorkspaceMode() {
    workspaceDirectoryHandle = null;
    workspaceHtmlHandles = {};
    nativeWorkspaceId = null;
    nativeWorkspaceFiles = {};
    wordOutputDirectoryHandle = null;
    wordNativeWorkspaceId = null;
    workspaceFolderButton.classList.remove('has-workspace');
    workspaceFolderName.hidden = true;
    workspaceFolderName.textContent = '';
    workspaceFolderHint.textContent = '选择 HTML，并把结果保存回此文件夹';
    workspaceFolderAction.textContent = '选择文件夹';
    workspaceHtmlSelect.hidden = true;
    workspaceHtmlSelect.innerHTML = '';
    selectedHtmlName.hidden = true;
    selectedHtmlName.textContent = '';
    htmlDropZone.classList.remove('has-file');
    htmlBrowseAction.hidden = false;
    htmlBrowseAction.textContent = '浏览文件';
    setHtmlPickerBrowseMode(true);
    htmlSaveLabel.textContent = '下载正文片段';
    txtSaveLabel.textContent = '下载转码文本';
  }

  function chooseHtml(file, options) {
    clearNotice(notice);
    clearWordFileSaveStatuses();
    resultPanel.hidden = true;
    latestWordResult = null;
    if (!options || !options.fromWorkspace) clearWorkspaceMode();
    if (!isHtmlFile(file)) {
      selectedHtml = null;
      updateWordSelection();
      setNotice(notice, '请选择 Word 导出的 .html 或 .htm 文件。', 'error');
      return;
    }
    selectedHtml = file;
    htmlDropZone.classList.add('has-file');
    if (!options || !options.fromWorkspace) {
      selectedHtmlName.textContent = '当前文件：' + file.name;
      selectedHtmlName.hidden = false;
      htmlBrowseAction.textContent = '更换文件';
    }
    outputBaseName.value = sourceBaseName(file.name);
    updateWordSelection();
  }

  async function loadWorkspaceHtml(name) {
    if (nativeWorkspaceId) {
      var metadata = nativeWorkspaceFiles[name];
      if (!metadata) return;
      wordOutputDirectoryHandle = null;
      wordNativeWorkspaceId = nativeWorkspaceId;
      htmlInput.value = '';
      chooseHtml({ name: metadata.name, size: metadata.size }, { fromWorkspace: true });
      htmlSaveLabel.textContent = '保存正文片段到源文件夹';
      txtSaveLabel.textContent = '保存转码文本到源文件夹';
      return;
    }
    var fileHandle = workspaceHtmlHandles[name];
    if (!fileHandle || !workspaceDirectoryHandle) return;
    wordOutputDirectoryHandle = workspaceDirectoryHandle;
    wordNativeWorkspaceId = null;
    htmlInput.value = '';
    chooseHtml(await fileHandle.getFile(), { fromWorkspace: true });
    htmlSaveLabel.textContent = '保存正文片段到源文件夹';
    txtSaveLabel.textContent = '保存转码文本到源文件夹';
  }

  async function chooseWorkspaceFolder() {
    if (!window.showDirectoryPicker) {
      var nativeResult = await postJson('/api/select-workspace', {});
      nativeWorkspaceId = nativeResult.workspaceId;
      nativeWorkspaceFiles = {};
      nativeResult.files.forEach(function (file) { nativeWorkspaceFiles[file.name] = file; });
      workspaceDirectoryHandle = null;
      workspaceHtmlHandles = {};
      workspaceFolderName.textContent = '当前工作文件夹：' + nativeResult.folderName;
      workspaceFolderName.hidden = false;
      workspaceFolderButton.classList.add('has-workspace');
      workspaceFolderHint.textContent = '生成结果将保存回此文件夹；同名时会先询问是否覆盖';
      workspaceFolderAction.textContent = '更换文件夹';
      workspaceHtmlSelect.innerHTML = nativeResult.files.map(function (file) {
        var escapedName = file.name.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
        return '<option value="' + escapedName + '">' +
          file.name.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</option>';
      }).join('');
      workspaceHtmlSelect.hidden = false;
      htmlBrowseAction.hidden = true;
      selectedHtmlName.hidden = true;
      selectedHtmlName.textContent = '';
      setHtmlPickerBrowseMode(false);
      await loadWorkspaceHtml(nativeResult.files[0].name);
      return;
    }
    var handle = await window.showDirectoryPicker({ mode: 'readwrite' });
    var htmlHandles = {};
    for await (var pair of handle.entries()) {
      var name = pair[0];
      var entry = pair[1];
      if (entry.kind === 'file' && /\.html?$/i.test(name) && !/^\.~/i.test(name) &&
          name.toLowerCase().indexOf('_legal_permission') === -1) {
        htmlHandles[name] = entry;
      }
    }
    var names = Object.keys(htmlHandles).sort();
    if (!names.length) throw new Error('所选文件夹中没有可处理的 Word HTML。');
    workspaceDirectoryHandle = handle;
    workspaceHtmlHandles = htmlHandles;
    nativeWorkspaceId = null;
    nativeWorkspaceFiles = {};
    workspaceFolderName.textContent = '当前工作文件夹：' + handle.name;
    workspaceFolderName.hidden = false;
    workspaceFolderButton.classList.add('has-workspace');
    workspaceFolderHint.textContent = '生成结果将保存回此文件夹；同名时会先询问是否覆盖';
    workspaceFolderAction.textContent = '更换文件夹';
    workspaceHtmlSelect.innerHTML = names.map(function (name) {
      return '<option value="' + name.replace(/&/g, '&amp;').replace(/"/g, '&quot;') + '">' +
        name.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</option>';
    }).join('');
    workspaceHtmlSelect.hidden = false;
    htmlBrowseAction.hidden = true;
    selectedHtmlName.hidden = true;
    selectedHtmlName.textContent = '';
    setHtmlPickerBrowseMode(false);
    await loadWorkspaceHtml(names[0]);
  }

  function readTextFile(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(String(reader.result || '')); };
      reader.onerror = function () { reject(new Error('无法读取文件：' + file.name)); };
      reader.readAsText(file, 'utf-8');
    });
  }

  function fileToBase64(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        var value = String(reader.result || '');
        var comma = value.indexOf(',');
        if (comma === -1) return reject(new Error('无法读取文件：' + file.name));
        resolve(value.slice(comma + 1));
      };
      reader.onerror = function () { reject(new Error('无法读取文件：' + file.name)); };
      reader.readAsDataURL(file);
    });
  }

  function postJson(url, body) {
    return fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    }).then(function (response) {
      return response.json().then(function (payload) {
        if (!response.ok || !payload.ok) {
          var requestError = new Error(payload.error || '处理失败，请检查内容后重试。');
          requestError.status = response.status;
          requestError.payload = payload;
          throw requestError;
        }
        return payload;
      });
    });
  }

  function downloadText(filename, content, mimeType) {
    var blob = new Blob([content], { type: mimeType + ';charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  async function workspaceFileExists(directoryHandle, filename) {
    try {
      await directoryHandle.getFileHandle(filename);
      return true;
    } catch (error) {
      if (error && error.name === 'NotFoundError') return false;
      throw error;
    }
  }

  function confirmOverwrite(filename) {
    return window.confirm('工作文件夹中已经存在同名文件：\n\n' + filename + '\n\n是否覆盖原文件？');
  }

  async function saveOrDownloadText(directoryHandle, nativeId, filename, content, mimeType) {
    if (nativeId) {
      var nativeSaved;
      try {
        nativeSaved = await postJson('/api/save-workspace', {
          workspaceId: nativeId, filename: filename, content: content, overwrite: false
        });
      } catch (error) {
        if (!error.payload || error.payload.code !== 'FILE_EXISTS') throw error;
        if (!confirmOverwrite(error.payload.filename || filename)) {
          return { mode: 'cancelled', filename: filename };
        }
        nativeSaved = await postJson('/api/save-workspace', {
          workspaceId: nativeId, filename: filename, content: content, overwrite: true
        });
      }
      return { mode: 'folder', filename: nativeSaved.filename, overwritten: Boolean(nativeSaved.overwritten) };
    }
    if (!directoryHandle) {
      downloadText(filename, content, mimeType);
      return { mode: 'download', filename: filename };
    }
    var exists = await workspaceFileExists(directoryHandle, filename);
    if (exists && !confirmOverwrite(filename)) return { mode: 'cancelled', filename: filename };
    var fileHandle = await directoryHandle.getFileHandle(filename, { create: true });
    var writable = await fileHandle.createWritable();
    try {
      await writable.write(content);
      await writable.close();
    } catch (error) {
      try { await writable.abort(); } catch (_abortError) {}
      throw error;
    }
    return { mode: 'folder', filename: filename, overwritten: exists };
  }

  async function copyText(button, content) {
    if (!content) return;
    var original = button.textContent;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(content);
      } else {
        var helper = document.createElement('textarea');
        helper.value = content;
        helper.style.position = 'fixed';
        helper.style.opacity = '0';
        document.body.appendChild(helper);
        helper.select();
        if (!document.execCommand('copy')) throw new Error('复制命令执行失败');
        helper.remove();
      }
      button.textContent = '已复制完整内容';
      button.classList.add('is-copied');
      setTimeout(function () {
        button.textContent = original;
        button.classList.remove('is-copied');
      }, 1600);
    } catch (error) {
      button.textContent = '复制失败，请手动复制';
      setTimeout(function () { button.textContent = original; }, 2000);
    }
  }

  function setWordBusy(busy) {
    htmlInput.disabled = busy; resetButton.disabled = busy; outputBaseName.disabled = busy;
    workspaceFolderButton.disabled = busy; workspaceHtmlSelect.disabled = busy;
    convertButton.disabled = busy || !selectedHtml || Boolean(outputBaseNameError(outputBaseName.value));
    convertButtonLabel.textContent = busy ? '正在转换与校验…' : '开始转换并校验';
  }

  htmlInput.addEventListener('change', function () { chooseHtml(htmlInput.files && htmlInput.files[0]); });
  outputBaseName.addEventListener('input', updateOutputNamePreview);
  htmlDropZone.addEventListener('click', function (event) {
    if (!htmlDropZone.classList.contains('is-browse-mode')) return;
    if (event.target === htmlInput) return;
    htmlInput.click();
  });
  htmlDropZone.addEventListener('keydown', function (event) {
    if (!htmlDropZone.classList.contains('is-browse-mode')) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    htmlInput.click();
  });
  workspaceFolderButton.addEventListener('click', async function () {
    clearNotice(notice);
    try { await chooseWorkspaceFolder(); }
    catch (error) {
      if (!error || error.name !== 'AbortError') setNotice(notice, error.message || '无法打开工作文件夹。', 'error');
    }
  });
  workspaceHtmlSelect.addEventListener('change', function () {
    loadWorkspaceHtml(workspaceHtmlSelect.value).catch(function (error) {
      setNotice(notice, error.message || '无法读取所选 HTML。', 'error');
    });
  });

  ['dragenter', 'dragover'].forEach(function (eventName) {
    htmlDropZone.addEventListener(eventName, function (event) {
      event.preventDefault(); htmlDropZone.classList.add('is-dragging');
    });
  });
  ['dragleave', 'drop'].forEach(function (eventName) {
    htmlDropZone.addEventListener(eventName, function (event) {
      event.preventDefault(); htmlDropZone.classList.remove('is-dragging');
    });
  });
  htmlDropZone.addEventListener('drop', function (event) {
    var files = Array.prototype.slice.call(event.dataTransfer.files || []);
    chooseHtml(files.filter(isHtmlFile)[0] || files[0]);
  });

  resetButton.addEventListener('click', function () {
    htmlInput.value = ''; selectedHtml = null;
    outputBaseName.value = '转换结果';
    clearWorkspaceMode();
    latestWordResult = null; resultPanel.hidden = true; clearNotice(notice); clearWordFileSaveStatuses(); updateWordSelection();
  });

  convertButton.addEventListener('click', async function () {
    if (!selectedHtml) return;
    var nameError = updateOutputNamePreview();
    if (nameError) {
      setNotice(notice, nameError, 'error');
      outputBaseName.focus();
      return;
    }
    var requestedOutputBaseName = outputBaseName.value.trim();
    setWordBusy(true); clearNotice(notice); clearWordFileSaveStatuses(); resultPanel.hidden = true; latestWordResult = null;
    try {
      var payload;
      if (wordNativeWorkspaceId) {
        payload = await postJson('/api/convert-workspace', {
          workspaceId: wordNativeWorkspaceId, name: selectedHtml.name,
          outputBaseName: requestedOutputBaseName
        });
      } else {
        payload = await postJson('/api/convert', {
          mainFile: { name: selectedHtml.name, contentBase64: await fileToBase64(selectedHtml) },
          outputBaseName: requestedOutputBaseName
        });
      }
      latestWordResult = payload;
      htmlDownloadName.textContent = payload.files.html;
      txtDownloadName.textContent = payload.files.txt;
      metrics.innerHTML = [
        '<div class="metric"><strong>' + payload.report.removed_images + '</strong><span>移除图片</span></div>',
        '<div class="metric"><strong>' + payload.report.disabled_links + '</strong><span>禁用链接</span></div>',
        '<div class="metric"><strong>' + payload.report.non_wrapping_urls + '</strong><span>不换行 URL</span></div>'
      ].join('');
      renderChecks(checks, payload.report);
      resultPanel.hidden = false;
      setNotice(notice, (wordOutputDirectoryHandle || wordNativeWorkspaceId) ?
        '转换与全部校验已通过，点击保存即可写回所选工作文件夹。' :
        '转换与全部校验已通过，可以下载文件或继续编辑 HTML。', 'info');
      resultPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
      setNotice(notice, error.message || '转换失败，请检查文件后重试。', 'error');
    } finally { setWordBusy(false); }
  });

  downloadHtmlButton.addEventListener('click', async function () {
    if (!latestWordResult) return;
    try {
      var saved = await saveOrDownloadText(wordOutputDirectoryHandle, wordNativeWorkspaceId,
        latestWordResult.files.html, latestWordResult.html, 'text/html');
      if (saved.mode === 'cancelled') {
        setNotice(notice, '已取消保存，原文件没有改变。', 'info');
        setFileSaveStatus(htmlFileSaveStatus, '已取消保存，原文件没有改变。', 'cancelled');
        return;
      }
      if (saved.mode === 'folder') {
        htmlDownloadName.textContent = saved.filename;
      }
      setFileSaveStatus(htmlFileSaveStatus, '下载成功', 'success');
    } catch (error) {
      setNotice(notice, 'HTML 保存失败：' + error.message, 'error');
      setFileSaveStatus(htmlFileSaveStatus, '正文片段保存失败：' + error.message, 'error');
    }
  });
  downloadTxtButton.addEventListener('click', async function () {
    if (!latestWordResult) return;
    try {
      var saved = await saveOrDownloadText(wordOutputDirectoryHandle, wordNativeWorkspaceId,
        latestWordResult.files.txt, latestWordResult.txt, 'text/plain');
      if (saved.mode === 'cancelled') {
        setNotice(notice, '已取消保存，原文件没有改变。', 'info');
        setFileSaveStatus(txtFileSaveStatus, '已取消保存，原文件没有改变。', 'cancelled');
        return;
      }
      if (saved.mode === 'folder') {
        txtDownloadName.textContent = saved.filename;
      }
      setFileSaveStatus(txtFileSaveStatus, '下载成功', 'success');
    } catch (error) {
      setNotice(notice, 'TXT 保存失败：' + error.message, 'error');
      setFileSaveStatus(txtFileSaveStatus, '转码文本保存失败：' + error.message, 'error');
    }
  });
  copyHtmlButton.addEventListener('click', function () {
    if (latestWordResult) copyText(copyHtmlButton, latestWordResult.html);
  });
  copyTxtButton.addEventListener('click', function () {
    if (latestWordResult) copyText(copyTxtButton, latestWordResult.txt);
  });
  editHtmlButton.addEventListener('click', function () {
    if (!latestWordResult) return;
    encodeSourceName = latestWordResult.files.html;
    encodeOutputDirectoryHandle = wordOutputDirectoryHandle;
    encodeNativeWorkspaceId = wordNativeWorkspaceId;
    encodeEditor.value = latestWordResult.html;
    encodeButton.disabled = false;
    encodeResult.hidden = true;
    latestEncodeResult = null;
    clearNotice(encodeNotice);
    activateTab('encode');
    encodeEditor.focus();
  });

  encodeInput.addEventListener('change', async function () {
    var file = encodeInput.files && encodeInput.files[0];
    if (!file) return;
    try {
      if (!isHtmlFile(file)) throw new Error('请选择 .html 或 .htm 文件。');
      encodeSourceName = file.name;
      encodeOutputDirectoryHandle = null;
      encodeNativeWorkspaceId = null;
      encodeEditor.value = await readTextFile(file);
      encodeButton.disabled = !encodeEditor.value.trim();
      encodeResult.hidden = true; latestEncodeResult = null; clearNotice(encodeNotice);
    } catch (error) { setNotice(encodeNotice, error.message, 'error'); }
  });
  encodeEditor.addEventListener('input', function () {
    encodeButton.disabled = !encodeEditor.value.trim();
    encodeResult.hidden = true; latestEncodeResult = null; clearNotice(encodeNotice);
  });
  encodeResetButton.addEventListener('click', function () {
    encodeInput.value = ''; encodeEditor.value = ''; encodeSourceName = '编辑后的正文.html';
    encodeOutputDirectoryHandle = null;
    encodeNativeWorkspaceId = null;
    encodeButton.disabled = true; encodeResult.hidden = true; latestEncodeResult = null; clearNotice(encodeNotice);
  });
  encodeButton.addEventListener('click', async function () {
    encodeButton.disabled = true; encodeButtonLabel.textContent = '正在转码与校验…';
    encodeResult.hidden = true; latestEncodeResult = null; clearNotice(encodeNotice);
    try {
      var payload = await postJson('/api/encode', { name: encodeSourceName, html: encodeEditor.value });
      latestEncodeResult = payload;
      encodeDownloadName.textContent = payload.files.txt;
      renderChecks(encodeChecks, payload.report);
      encodeResult.hidden = false;
      setNotice(encodeNotice, 'HTML 已逐字符转码并通过 core-data 安全校验。', 'info');
      encodeResult.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) { setNotice(encodeNotice, error.message || 'HTML 转码失败。', 'error'); }
    finally { encodeButtonLabel.textContent = '生成并校验 TXT'; encodeButton.disabled = !encodeEditor.value.trim(); }
  });
  encodeDownloadButton.addEventListener('click', async function () {
    if (!latestEncodeResult) return;
    try {
      var saved = await saveOrDownloadText(encodeOutputDirectoryHandle, encodeNativeWorkspaceId,
        latestEncodeResult.files.txt, latestEncodeResult.txt, 'text/plain');
      if (saved.mode === 'cancelled') {
        setNotice(encodeNotice, '已取消保存，原文件没有改变。', 'info');
        return;
      }
      if (saved.mode === 'folder') {
        encodeDownloadName.textContent = saved.filename;
        setNotice(encodeNotice, (saved.overwritten ? 'TXT 已覆盖并保存：' : 'TXT 已保存到工作文件夹：') + saved.filename, 'info');
      }
    } catch (error) { setNotice(encodeNotice, 'TXT 保存失败：' + error.message, 'error'); }
  });
  encodeCopyButton.addEventListener('click', function () {
    if (latestEncodeResult) copyText(encodeCopyButton, latestEncodeResult.txt);
  });
  openDecodeButton.addEventListener('click', function () {
    if (!latestEncodeResult) return;
    decodeSourceName = latestEncodeResult.files.txt;
    decodeOutputDirectoryHandle = encodeOutputDirectoryHandle;
    decodeNativeWorkspaceId = encodeNativeWorkspaceId;
    decodeEditor.value = latestEncodeResult.txt;
    decodeButton.disabled = false;
    decodeResult.hidden = true; latestDecodeResult = null; clearNotice(decodeNotice);
    activateTab('decode');
    decodeEditor.focus();
  });

  decodeInput.addEventListener('change', async function () {
    var file = decodeInput.files && decodeInput.files[0];
    if (!file) return;
    try {
      if (!/\.txt$/i.test(file.name)) throw new Error('请选择 .txt 文件。');
      decodeSourceName = file.name;
      decodeOutputDirectoryHandle = null;
      decodeNativeWorkspaceId = null;
      decodeEditor.value = await readTextFile(file);
      decodeButton.disabled = !decodeEditor.value.trim();
      decodeResult.hidden = true; latestDecodeResult = null; clearNotice(decodeNotice);
    } catch (error) { setNotice(decodeNotice, error.message, 'error'); }
  });
  decodeEditor.addEventListener('input', function () {
    decodeButton.disabled = !decodeEditor.value.trim();
    decodeResult.hidden = true; latestDecodeResult = null; clearNotice(decodeNotice);
  });
  decodeResetButton.addEventListener('click', function () {
    decodeInput.value = ''; decodeEditor.value = ''; decodeSourceName = '转码文本.txt';
    decodeOutputDirectoryHandle = null;
    decodeNativeWorkspaceId = null;
    decodeButton.disabled = true; decodeResult.hidden = true; latestDecodeResult = null; clearNotice(decodeNotice);
  });
  decodeButton.addEventListener('click', async function () {
    decodeButton.disabled = true; decodeButtonLabel.textContent = '正在解析与校验…';
    decodeResult.hidden = true; latestDecodeResult = null; clearNotice(decodeNotice);
    try {
      var payload = await postJson('/api/decode', { name: decodeSourceName, txt: decodeEditor.value });
      latestDecodeResult = payload;
      decodeDownloadName.textContent = payload.files.html;
      renderChecks(decodeChecks, payload.report);
      decodeResult.hidden = false;
      setNotice(decodeNotice, 'TXT 已成功还原，并通过重新编码一致性校验。', 'info');
      decodeResult.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) { setNotice(decodeNotice, error.message || 'TXT 解析失败。', 'error'); }
    finally { decodeButtonLabel.textContent = '解析并校验 HTML'; decodeButton.disabled = !decodeEditor.value.trim(); }
  });
  decodeDownloadButton.addEventListener('click', async function () {
    if (!latestDecodeResult) return;
    try {
      var saved = await saveOrDownloadText(decodeOutputDirectoryHandle, decodeNativeWorkspaceId,
        latestDecodeResult.files.html, latestDecodeResult.html, 'text/html');
      if (saved.mode === 'cancelled') {
        setNotice(decodeNotice, '已取消保存，原文件没有改变。', 'info');
        return;
      }
      if (saved.mode === 'folder') {
        decodeDownloadName.textContent = saved.filename;
        setNotice(decodeNotice, (saved.overwritten ? 'HTML 已覆盖并保存：' : 'HTML 已保存到工作文件夹：') + saved.filename, 'info');
      }
    } catch (error) { setNotice(decodeNotice, 'HTML 保存失败：' + error.message, 'error'); }
  });
  decodeCopyButton.addEventListener('click', function () {
    if (latestDecodeResult) copyText(decodeCopyButton, latestDecodeResult.html);
  });

  fetch('/api/health').then(function (response) {
    if (!response.ok) throw new Error();
    serverStatus.className = 'online'; serverStatus.innerHTML = '<i></i>本地处理服务已连接';
  }).catch(function () {
    serverStatus.className = 'offline'; serverStatus.innerHTML = '<i></i>本地处理服务未连接，请重新启动';
    setNotice(notice, '无法连接本地处理服务。请关闭页面后重新运行启动器。', 'error');
  });
})();

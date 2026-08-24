#!/usr/bin/env node

'use strict';

const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const childProcess = require('child_process');
const crypto = require('crypto');

const HOST = '127.0.0.1';
const PORT = Number(process.env.WORD_HTML_VISUAL_PORT || 4173);
const MAX_BODY_BYTES = 150 * 1024 * 1024;
const visualDirectory = __dirname;
const processorPath = path.resolve(
  visualDirectory,
  '..',
  '脚本',
  'consent-word-html',
  'scripts',
  'process-consent-word-html.js'
);
const processor = require(processorPath);
const workspaces = new Map();

function sendJson(response, statusCode, value) {
  const text = JSON.stringify(value);
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(text),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  response.end(text);
}

function sendStatic(response, filename, contentType) {
  const filePath = path.join(visualDirectory, filename);
  fs.readFile(filePath, function (error, content) {
    if (error) return sendJson(response, 404, { ok: false, error: '页面资源不存在。' });
    response.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': content.length,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    });
    response.end(content);
  });
}

function collectJson(request) {
  return new Promise(function (resolve, reject) {
    const chunks = [];
    let size = 0;
    request.on('data', function (chunk) {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('选择的文件总量超过 150 MB。'));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', function () {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch (_error) {
        reject(new Error('无法读取页面提交的文件数据。'));
      }
    });
    request.on('error', reject);
  });
}

function safeRelativePath(value) {
  if (typeof value !== 'string' || !value || value.indexOf('\0') !== -1) {
    throw new Error('资源文件路径无效。');
  }
  const normalized = value.replace(/\\/g, '/');
  if (normalized.charAt(0) === '/' || /^[A-Za-z]:\//.test(normalized)) {
    throw new Error('资源文件不能使用绝对路径：' + value);
  }
  const parts = normalized.split('/');
  if (parts.some(function (part) { return !part || part === '.' || part === '..'; })) {
    throw new Error('资源文件路径不安全：' + value);
  }
  return parts.join(path.sep);
}

function decodeBase64(value, label) {
  if (typeof value !== 'string' || !value) throw new Error('文件内容为空：' + label);
  return Buffer.from(value, 'base64');
}

function removeEntry(entryPath) {
  if (!fs.existsSync(entryPath)) return;
  const stat = fs.lstatSync(entryPath);
  if (stat.isDirectory() && !stat.isSymbolicLink()) {
    fs.readdirSync(entryPath).forEach(function (name) {
      removeEntry(path.join(entryPath, name));
    });
    fs.rmdirSync(entryPath);
    return;
  }
  fs.unlinkSync(entryPath);
}

function writeInsideTemporaryDirectory(temporaryDirectory, relativePath, content) {
  const target = path.resolve(temporaryDirectory, safeRelativePath(relativePath));
  const prefix = temporaryDirectory + path.sep;
  if (target.indexOf(prefix) !== 0) throw new Error('资源文件路径超出临时处理目录。');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
  return target;
}

function normalizeOutputBaseName(value, inputName) {
  const extension = path.extname(inputName);
  const fallback = path.basename(inputName, extension) || '转换结果';
  const name = value === undefined || value === null ? fallback : String(value).trim();
  if (!name) throw new Error('生成文件名称不能为空。');
  if (name.length > 120) throw new Error('生成文件名称不能超过 120 个字符。');
  if (/[\\/:*?"<>|\u0000-\u001f]/.test(name)) {
    throw new Error('生成文件名称包含不允许的字符。');
  }
  if (/^[.]+$/.test(name) || /[. ]$/.test(name)) {
    throw new Error('生成文件名称不能只包含句点，也不能以句点或空格结尾。');
  }
  if (/\.(?:html?|txt)$/i.test(name)) throw new Error('生成文件名称不需要填写扩展名。');
  return name;
}

function outputNames(inputName, requestedBaseName) {
  const stem = normalizeOutputBaseName(requestedBaseName, inputName);
  return {
    html: stem + '_legal_permission.html',
    txt: stem + '_转码+转义.txt'
  };
}

function isSourceHtmlName(name) {
  return /\.html?$/i.test(name) && !/^\.~/i.test(name) &&
    name.toLowerCase().indexOf('_legal_permission') === -1;
}

function describeWorkspace(directoryPath) {
  const files = fs.readdirSync(directoryPath).filter(isSourceHtmlName).sort().map(function (name) {
    const filePath = path.join(directoryPath, name);
    const stat = fs.lstatSync(filePath);
    if (!stat.isFile() || stat.isSymbolicLink()) return null;
    return { name: name, size: stat.size };
  }).filter(Boolean);
  if (!files.length) throw new Error('所选文件夹中没有可处理的 Word HTML。');
  const id = crypto.randomBytes(24).toString('hex');
  workspaces.set(id, { directory: directoryPath, createdAt: Date.now() });
  return { ok: true, workspaceId: id, folderName: path.basename(directoryPath), files: files };
}

function selectNativeWorkspace() {
  if (process.platform !== 'darwin') {
    throw new Error('当前浏览器不支持文件夹写入，请改用 Chrome 或 Edge。');
  }
  let selected;
  try {
    selected = childProcess.execFileSync('osascript', [
      '-e', 'POSIX path of (choose folder with prompt "选择包含 Word HTML 的工作文件夹")'
    ], { encoding: 'utf8', timeout: 10 * 60 * 1000 }).trim();
  } catch (error) {
    if (error && (error.status === 1 || /User canceled|-128/i.test(String(error.stderr || error.message)))) {
      throw new Error('已取消选择工作文件夹。');
    }
    throw new Error('无法打开系统文件夹选择窗口。');
  }
  const directoryPath = path.resolve(selected);
  const stat = fs.lstatSync(directoryPath);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('所选位置不是有效文件夹。');
  return describeWorkspace(directoryPath);
}

function getWorkspace(payload) {
  const id = payload && String(payload.workspaceId || '');
  const workspace = workspaces.get(id);
  if (!workspace) throw new Error('工作文件夹授权已失效，请重新选择。');
  if (!fs.existsSync(workspace.directory) || !fs.statSync(workspace.directory).isDirectory()) {
    workspaces.delete(id);
    throw new Error('工作文件夹已经不存在，请重新选择。');
  }
  return workspace;
}

function resolveWorkspaceFile(workspace, filename, extensions) {
  const name = path.basename(String(filename || ''));
  if (name !== filename || !extensions.some(function (extension) { return name.toLowerCase().endsWith(extension); })) {
    throw new Error('文件名无效。');
  }
  const target = path.join(workspace.directory, name);
  const stat = fs.lstatSync(target);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('所选文件无效。');
  return target;
}

function convertWorkspace(payload) {
  const workspace = getWorkspace(payload);
  const inputPath = resolveWorkspaceFile(workspace, String(payload.name || ''), ['.html', '.htm']);
  const source = fs.readFileSync(inputPath, 'utf8').replace(/^\uFEFF/, '');
  const result = processor.processHtml(source, inputPath);
  return {
    ok: true,
    files: outputNames(path.basename(inputPath), payload.outputBaseName),
    html: result.fragment,
    txt: result.txt,
    report: result.report
  };
}

function saveWorkspaceOutput(payload) {
  const workspace = getWorkspace(payload);
  const requestedName = path.basename(String(payload.filename || ''));
  if (requestedName !== payload.filename || !/\.(?:html?|txt)$/i.test(requestedName)) {
    throw new Error('输出文件名无效。');
  }
  if (typeof payload.content !== 'string') throw new Error('输出内容无效。');
  if (Buffer.byteLength(payload.content) > MAX_BODY_BYTES) throw new Error('输出内容超过 150 MB。');
  const target = path.join(workspace.directory, requestedName);
  const exists = fs.existsSync(target);
  if (exists) {
    const stat = fs.lstatSync(target);
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('同名位置不是可覆盖的普通文件。');
    if (payload.overwrite !== true) {
      const conflict = new Error('工作文件夹中已存在同名文件。');
      conflict.code = 'FILE_EXISTS';
      conflict.filename = requestedName;
      throw conflict;
    }
  }
  fs.writeFileSync(target, payload.content, { encoding: 'utf8', flag: exists ? 'w' : 'wx' });
  return { ok: true, filename: requestedName, overwritten: exists };
}

async function convert(payload) {
  if (!payload || !payload.mainFile) throw new Error('请选择 Word 导出的 HTML 文件。');
  const mainName = path.basename(String(payload.mainFile.name || ''));
  if (!/\.html?$/i.test(mainName)) throw new Error('主文件必须是 .html 或 .htm。');
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'word-html-visual-'));
  try {
    const inputPath = writeInsideTemporaryDirectory(
      temporaryDirectory,
      mainName,
      decodeBase64(payload.mainFile.contentBase64, mainName)
    );
    const source = fs.readFileSync(inputPath, 'utf8').replace(/^\uFEFF/, '');
    const result = processor.processHtml(source, inputPath);
    const names = outputNames(mainName, payload.outputBaseName);
    return {
      ok: true,
      files: names,
      html: result.fragment,
      txt: result.txt,
      report: result.report
    };
  } finally {
    removeEntry(temporaryDirectory);
  }
}

function encodeEditedHtml(payload) {
  if (!payload || typeof payload.html !== 'string') throw new Error('请上传或粘贴需要转码的 HTML。');
  const inputName = path.basename(String(payload.name || '编辑后的正文.html'));
  const result = processor.encodeFragment(payload.html);
  const stem = path.basename(inputName, path.extname(inputName));
  return {
    ok: true,
    files: { txt: stem + '_转码+转义.txt' },
    txt: result.txt,
    report: result.report
  };
}

function decodeTxtPayload(payload) {
  if (!payload || typeof payload.txt !== 'string') throw new Error('请上传或粘贴需要解析的 TXT。');
  const inputName = path.basename(String(payload.name || '转码文本.txt'));
  const result = processor.decodeTxt(payload.txt);
  const stem = path.basename(inputName, path.extname(inputName));
  return {
    ok: true,
    files: { html: stem + '_还原.html' },
    html: result.html,
    report: result.report
  };
}

const routes = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/index.html': ['index.html', 'text/html; charset=utf-8'],
  '/app.js': ['app.js', 'application/javascript; charset=utf-8'],
  '/styles.css': ['styles.css', 'text/css; charset=utf-8']
};

const server = http.createServer(function (request, response) {
  const requestPath = String(request.url || '').split('?')[0];
  if (request.method === 'GET' && routes[requestPath]) {
    return sendStatic(response, routes[requestPath][0], routes[requestPath][1]);
  }
  if (request.method === 'GET' && requestPath === '/api/health') {
    return sendJson(response, 200, { ok: true, offline: true });
  }
  if (request.method === 'POST' && requestPath === '/api/convert') {
    return collectJson(request).then(convert).then(function (result) {
      sendJson(response, 200, result);
    }).catch(function (error) {
      if (!response.headersSent) sendJson(response, 400, { ok: false, error: error.message });
    });
  }
  if (request.method === 'POST' && requestPath === '/api/select-workspace') {
    return collectJson(request).then(selectNativeWorkspace).then(function (result) {
      sendJson(response, 200, result);
    }).catch(function (error) {
      if (!response.headersSent) sendJson(response, 400, { ok: false, error: error.message });
    });
  }
  if (request.method === 'POST' && requestPath === '/api/convert-workspace') {
    return collectJson(request).then(convertWorkspace).then(function (result) {
      sendJson(response, 200, result);
    }).catch(function (error) {
      if (!response.headersSent) sendJson(response, 400, { ok: false, error: error.message });
    });
  }
  if (request.method === 'POST' && requestPath === '/api/save-workspace') {
    return collectJson(request).then(saveWorkspaceOutput).then(function (result) {
      sendJson(response, 200, result);
    }).catch(function (error) {
      if (!response.headersSent) sendJson(response, error.code === 'FILE_EXISTS' ? 409 : 400, {
        ok: false,
        error: error.message,
        code: error.code || '',
        filename: error.filename || ''
      });
    });
  }
  if (request.method === 'POST' && requestPath === '/api/encode') {
    return collectJson(request).then(encodeEditedHtml).then(function (result) {
      sendJson(response, 200, result);
    }).catch(function (error) {
      if (!response.headersSent) sendJson(response, 400, { ok: false, error: error.message });
    });
  }
  if (request.method === 'POST' && requestPath === '/api/decode') {
    return collectJson(request).then(decodeTxtPayload).then(function (result) {
      sendJson(response, 200, result);
    }).catch(function (error) {
      if (!response.headersSent) sendJson(response, 400, { ok: false, error: error.message });
    });
  }
  sendJson(response, 404, { ok: false, error: '请求地址不存在。' });
});

function openBrowser(url) {
  let command;
  let args;
  if (process.platform === 'darwin') {
    command = 'open'; args = [url];
  } else if (process.platform === 'win32') {
    command = 'cmd'; args = ['/c', 'start', '', url];
  } else {
    command = 'xdg-open'; args = [url];
  }
  try {
    childProcess.spawn(command, args, { detached: true, stdio: 'ignore' }).unref();
  } catch (_error) {
    console.log('请在浏览器打开：' + url);
  }
}

server.on('error', function (error) {
  if (error.code === 'EADDRINUSE') {
    console.error('启动失败：端口 ' + PORT + ' 已被占用。请关闭旧的可视化版本后重试。');
  } else {
    console.error('启动失败：' + error.message);
  }
  process.exitCode = 1;
});

server.listen(PORT, HOST, function () {
  const url = 'http://' + HOST + ':' + PORT + '/';
  console.log('Word HTML 可视化转换器已启动：' + url);
  console.log('完全离线运行；关闭此终端即可停止服务。');
  if (process.argv.indexOf('--no-open') === -1) openBrowser(url);
});

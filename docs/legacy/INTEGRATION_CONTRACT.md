# 集成接口契约 v1：「更了解你的 AI」插件 × File Organizer

> 两个项目由不同的 AI Agent 开发，本文件是双方唯一的共同依据。两个仓库各放一份，内容必须一致。
> 任何一方需要改动契约，先改本文件并把 `protocol` 版本号加 1，再通知另一方同步，不得单方面改实现。
> 设计背景见《更了解你的 AI × File Organizer · v3》方案文档。

## 1. 职责划分

| 部件 | 负责方 | 位置 |
|---|---|---|
| 下载采集、会话、敏感判断、MCP 快照内容 | 插件 Agent | 插件仓库（TypeScript） |
| native host 二进制 `fo_host` | File Organizer Agent | `native/` 下 `fo_core` 工作区 |
| 收件箱 `inbox.db` 的表结构 | File Organizer Agent | 由 `fo_core` 创建和迁移 |
| MCP server 二进制 `fo_mcp` | File Organizer Agent | `native/` 下 `fo_core` 工作区 |
| native host 注册（manifest + 注册表） | File Organizer Agent | 安装包与设置页 |
| URL 规范化与哈希 | 双方各自实现，必须通过第 4 节测试向量 | Rust 与 TS |

插件 Agent 不写 Rust；File Organizer Agent 不改插件代码。

## 2. Native Messaging 基本约定

- host 名称：`com.fileorganizer.host`
- 传输：Chrome native messaging 标准格式（4 字节小端长度 + UTF-8 JSON）。单条消息不超过 1 MB。
- host 的 stdout 只能输出协议消息，日志一律写文件。
- 每条消息都带 `type`；请求带 `reqId`（UUID），响应原样带回 `reqId`。
- 连接后第一条消息必须是 `hello`，版本不兼容时 host 返回 `error` 并退出。
- 插件的扩展 ID 必须固定：开发期在 manifest 中写入 `key`，manifest 的 `allowed_origins` 使用该 ID。

## 3. 消息定义（protocol = 1）

所有时间为 UTC 毫秒整数；`sensitive` 取值为 `health | job | finance | personal` 或省略。

### 3.1 握手
```jsonc
// 插件 → host
{ "type": "hello", "reqId": "…", "protocol": 1, "extVersion": "0.3.0" }
// host → 插件
{ "type": "hello_ack", "reqId": "…", "protocol": 1, "hostVersion": "0.1.0" }
```

### 3.2 下载记录
插件在 `chrome.downloads` 状态变为 `complete` 时发送。`path` 取自 `DownloadItem.filename`（绝对路径）。
```jsonc
// 插件 → host
{ "type": "download", "reqId": "…",
  "downloadId": "插件内 Download.id",
  "sessionId": "…", "visitId": "…", "projectId": "…?",
  "urlHash": "…", "referrerHash": "…?",
  "pageTitle": "…", "filename": "report.pdf",
  "path": "C:\\Users\\…\\Downloads\\report.pdf",
  "downloadedAt": 1790000000000,
  "sensitive": "job?" }
// host → 插件（成功：已写入收件箱）
{ "type": "download_ack", "reqId": "…", "downloadId": "…", "quickHash": "…", "size": 123456 }
```
插件在收到 `download_ack` 之前，把该记录标记为待同步，下次连接时重发。host 必须对同一 `downloadId` 幂等。

### 3.3 会话信息后续更新
每晚批处理后，会话的项目归属或敏感类别可能变化，插件发送：
```jsonc
{ "type": "session_update", "reqId": "…", "sessionId": "…", "projectId": "…?", "sensitive": "health?" }
// host → { "type": "ok", "reqId": "…" }
```

### 3.4 遗忘
用户在插件里删除会话并选择一并删除来源记录时：
```jsonc
{ "type": "forget_session", "reqId": "…", "sessionId": "…" }
// host → { "type": "ok", "reqId": "…" }
```

### 3.5 来源反查（插件管不到的下载）
File Organizer 对只有 `Zone.Identifier` 来源的资源生成反查请求；插件每晚批处理时取走并回答。
```jsonc
// 插件 → host
{ "type": "fetch_lookups", "reqId": "…" }
// host → 插件
{ "type": "lookups", "reqId": "…", "items": [ { "lookupId": "…", "urlHash": "…" } ] }
// 插件 → host（找不到的也要回，sessionId 省略即可）
{ "type": "lookup_results", "reqId": "…",
  "items": [ { "lookupId": "…", "sessionId": "…?", "projectId": "…?", "pageTitle": "…?", "sensitive": "…?" } ] }
// host → { "type": "ok", "reqId": "…" }
```

### 3.6 文件信号（供插件兴趣打分 w5）
```jsonc
// 插件 → host
{ "type": "fetch_resource_signals", "reqId": "…", "sessionIds": ["…"] }
// host → 插件（host 只读打开 File Organizer 主库）
{ "type": "resource_signals", "reqId": "…",
  "items": [ { "sessionId": "…", "resourceId": "…", "favorite": true, "rating": 4 } ] }
```
私密资源（见第 6 节）不返回。

### 3.7 MCP 快照
插件每晚批处理后发送，供 `fo_mcp` 回答 v2 的六个工具。host 原子写入 `snapshot.json`（先写临时文件再改名）。
```jsonc
{ "type": "mcp_snapshot", "reqId": "…", "generatedAt": 1790000000000,
  "interests": [], "projects": [], "trends": [], "digest": {}, "pages": [] }
// host → { "type": "ok", "reqId": "…" }
```
快照内容由插件 Agent 定义并在本节补充字段表；敏感会话和被静默主题不得进入快照。

### 3.8 错误
```jsonc
{ "type": "error", "reqId": "…", "code": "FILE_NOT_FOUND | PROTOCOL_MISMATCH | BAD_MESSAGE | INTERNAL", "message": "…" }
```
`FILE_NOT_FOUND`：下载文件已被移走或删除。插件保留记录，不再重发。

## 4. URL 规范化与哈希

双方必须逐字节一致，否则来源反查全部失效。

1. 去掉首尾空白；scheme 和 host 转小写。
2. 去掉默认端口（http 的 80、https 的 443）。
3. 去掉 fragment（`#` 之后）。
4. path 为空时写作 `/`；path 大小写保持原样。
5. 删除查询参数：名称以 `utm_` 开头的，以及 `fbclid gclid dclid msclkid mc_eid mc_cid igshid yclid spm`（名称比较不区分大小写）。
6. 剩余参数按参数名、再按值做字典序排序；参数的原始编码保持不变，不解码也不重新编码。
7. 对结果做 SHA-256，输出 64 位小写十六进制。

若插件已有实现且规则不同，以插件实现为准，更新本节并重新生成测试向量。

| 输入 | 规范化结果 | SHA-256 |
|---|---|---|
| `https://Example.com/Report.pdf?utm_source=x&b=2&a=1#top` | `https://example.com/Report.pdf?a=1&b=2` | `86e03b43e7a6f0905543afcc945061cb419d7b4b20806492a510168a2c0e974b` |
| `https://example.com:443/report.pdf?fbclid=abc&a=1&b=2` | `https://example.com/report.pdf?a=1&b=2` | `c3e1cc93f134c790d92525a1d87a7284528199893a77212991669b769fcf9e0d` |
| `http://arxiv.org/pdf/2401.00001v2` | `http://arxiv.org/pdf/2401.00001v2` | `1203ecf060aa6e8e5536268c9a7c1e36903d6afc5c95a9a0a07b5493dda02894` |
| `https://www.douban.com/?gclid=zz` | `https://www.douban.com/` | `e106715efc1a3e3eb0827455c7f9a09c0b794c88ca62f7f6dc83f73f70985905` |

双方都要把这张表写成单元测试。

## 5. 收件箱 `inbox.db`

- 位置：File Organizer 应用数据目录，与 drift 主库同目录。WAL 模式。
- `fo_host` 写入；File Organizer 读取后填 `consumed_at` / `answered_at`。主库只由 File Organizer 写。
- 表结构由 `fo_core` 创建，版本记录在 `PRAGMA user_version`。

```sql
CREATE TABLE inbox_download (
  download_id   TEXT PRIMARY KEY,   -- 插件 Download.id，保证幂等
  session_id    TEXT NOT NULL,
  visit_id      TEXT,
  project_id    TEXT,
  url_hash      TEXT NOT NULL,
  referrer_hash TEXT,
  page_title    TEXT,
  filename      TEXT NOT NULL,
  path          TEXT NOT NULL,
  quick_hash    TEXT NOT NULL,      -- 与 import_service 同一函数计算
  size          INTEGER NOT NULL,
  downloaded_at INTEGER NOT NULL,
  sensitive     TEXT,
  received_at   INTEGER NOT NULL,
  consumed_at   INTEGER
);
CREATE TABLE inbox_session_update (
  id TEXT PRIMARY KEY, session_id TEXT NOT NULL, project_id TEXT, sensitive TEXT,
  received_at INTEGER NOT NULL, consumed_at INTEGER
);
CREATE TABLE inbox_forget (
  id TEXT PRIMARY KEY, session_id TEXT NOT NULL,
  received_at INTEGER NOT NULL, consumed_at INTEGER
);
CREATE TABLE lookup_request (           -- File Organizer 写入请求，host 回填答案
  lookup_id   TEXT PRIMARY KEY,
  resource_id TEXT NOT NULL,
  url_hash    TEXT NOT NULL,
  created_at  INTEGER NOT NULL,
  answered_at INTEGER,
  session_id  TEXT, project_id TEXT, page_title TEXT, sensitive TEXT,
  consumed_at INTEGER
);
CREATE TABLE proposal (                 -- fo_mcp 写入外部智能体的整理提议
  id TEXT PRIMARY KEY, resource_id TEXT NOT NULL,
  action TEXT NOT NULL,                 -- rename | move | tag
  payload_json TEXT NOT NULL, proposed_by TEXT NOT NULL,
  created_at INTEGER NOT NULL, decided_at INTEGER, decision TEXT  -- approved | rejected
);
```

## 6. 私密规则

- 任何带 `sensitive` 的下载或会话，对应资源在 File Organizer 中视为私密。
- 私密资源：不发给云端 AI，不经 `fo_mcp` 返回，不出现在 `resource_signals`，Sidecar 导出不含来源字段。
- 私密标记只升不降，只能由用户在 File Organizer 检查器里手动解除。

## 7. 联调验收

1. 插件开发版下载一个 PDF，10 秒内 File Organizer 检查器显示来源页标题和会话。
2. 在资源管理器里把该文件移到库根目录另一处，来源仍在。
3. 用微信或其他浏览器下载一个文件（有 `Zone.Identifier`），插件每晚批处理后，该文件补上会话。
4. 在插件里删除该会话并选择一并删除来源，File Organizer 中来源记录消失，文件和档案仍在。
5. 敏感会话里下载的文件，在 Claude Desktop 里通过 MCP 查不到。

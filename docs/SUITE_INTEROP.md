# 套件互联与独立运行设计（v0.3）

> 适用项目：File Organizer（FO，桌面端）、OnlineAlbumPlugin（OAP，浏览器插件）、Marginalia（MG，浏览器插件）
> 本文是对 INTEGRATION_CONTRACT 的上层约束，协议细节以 suite-contract 中的 JSON Schema 为准。

---

## 0. 核心原则

1. **独立完整**：每个产品单独安装就是一个完整产品，有自己的存储、自己的 UI、自己的全部核心功能。不存在"必须装另一个才能用"的功能。
2. **连接只做加法**：连接后出现的功能是增强，断开后这些功能隐藏（不是报错、不是残缺），核心功能不受影响。
3. **各自持库，不共享数据库**：任何产品都不直接写别人的数据库。跨产品数据只通过消息（inbox）和只读查询流动。
4. **连接是显式的、可撤销的**：用户主动"连接"，随时可"断开"；断开时用户决定是否清除镜像数据。
5. **按能力判断，不按版本判断**：功能是否可用取决于握手返回的能力列表，而不是对方版本号。
6. **离线也能互通**：没有 host 或不在同一台机器时，版本化的导出/导入包是兜底互通方式。

---

## 1. 运行模式

每个产品对每个"对端"维护一个连接状态：

| 状态 | 含义 | 行为 |
|---|---|---|
| `standalone` | 从未连接或已断开 | 不写 outbox，不发起任何 host 通信；连接相关 UI 只在设置页出现一个"连接桌面端"入口 |
| `linked_online` | 已连接，host 可达 | outbox 实时投递；查询类功能（标签树、已在库中）可用 |
| `linked_offline` | 已连接，host 暂不可达（未安装、被卸载、机器不同） | 继续写 outbox 并在可达后补投；查询类功能使用本地缓存快照，并标注"缓存于 X 时间" |

状态转换：

```
standalone ──用户点击连接 + 握手成功──▶ linked_online
linked_online ──host 不可达──▶ linked_offline ──host 恢复──▶ linked_online
linked_* ──用户点击断开──▶ standalone（按用户选择保留或清除镜像数据）
```

host 不可达的判定：`chrome.runtime.connectNative` 报错（如 host 未注册）或握手超时。判定后静默切换到 `linked_offline`，只在状态指示器上显示，不弹窗。

---

## 2. 能力矩阵：独立 vs 连接

### File Organizer

| 能力 | 独立运行 | 连接 OAP 后 | 连接 MG 后 |
|---|---|---|---|
| 资源档案、指纹、找回、标签、智能目录 | 完整 | — | — |
| 搜刮 | 内置 Scraper | 共享声明式规则（同一份规则两端生效） | — |
| 来源信息 | 读取文件自带来源（Zone.Identifier / xattr） | + 采集时的页面上下文、搜刮字段、实体 | + 下载时所在会话、项目 |
| 相关资源评分 | 标签、实体、相似度 | + 同一采集来源 | + 同会话 +1.5、同项目 +1.0 |
| "懂你"页 | **基础版**：基于本库信号（收藏、评分、打开次数、标签活跃度、导入历史） | — | **完整版**：+ 兴趣地图、重新发现、项目工作台 |

### OnlineAlbumPlugin

| 能力 | 独立运行 | 连接 FO 后 |
|---|---|---|
| 云盘浏览、网页采集、标签、评分、收集箱、集合、搜刮、AI 打标 | 完整（本地 Dexie，扁平/本地标签） | — |
| 标签选择器 | 本地标签 | FO 标签树（缓存）+ 本地标签，二者合并显示 |
| 收藏并下载 | 普通下载 | 下载附带完整档案，FO 入库即完整 |
| 只收藏引用 | 存本地 | + 镜像为 FO 的 `url` 资源 |
| 已在库中角标 | 仅本地收藏状态 | + FO 本地文件状态（按 URL 哈希、来源键、云盘 md5/sha256） |

### Marginalia

| 能力 | 独立运行 | 连接 FO 后 |
|---|---|---|
| 采集、会话、兴趣、日记、趋势、项目、唤醒、推荐 | 完整（v2 原样） | — |
| 下载证据 | 记录 Download（文件名、时间、页面） | + 关联到 FO 资源（provenance） |
| 兴趣打分 | w1–w4 | + w5 文件收藏评分 |
| 日记下载栏、项目下载栏 | 显示下载记录 | + 可点击跳转到 FO 中的资源 |

**设计要求**：FO 的"懂你"页必须按数据源分层设计，每一块注明依赖哪个数据源；数据源缺失的块不显示，而不是显示空状态。

---

## 3. 数据所有权与流向

### 3.1 所有权表

| 数据 | 所有者 | 流向 | 冲突规则 |
|---|---|---|---|
| 本地文件资源、字段、实体 | FO | 只读查询给插件 | FO 为准 |
| 标签树（连接时） | FO | 只读快照给 OAP | FO 为准；OAP 本地标签保留 |
| 远程引用（未下载的云盘/网页资源） | OAP | 推送镜像到 FO | OAP 为准；FO 中的镜像字段标记 `source=oap` |
| 下载文件的采集上下文 | OAP | 随下载推送到 FO | 写入 FO 后即归 FO，按 FO 的字段锁定规则处理 |
| 浏览行为、会话、兴趣、项目 | MG | provenance 推送；兴趣快照只读给 FO | MG 为准 |
| 用户在 OAP 中对已入库文件的再编辑 | — | 作为 **proposal** 推送 | FO 中审核或按设置自动采纳 |

### 3.2 标签：连接与断开时的处理（最难的部分）

OAP 始终保留自己的 `tags` 表。连接后新增映射表：

```ts
tagLink: { localTagId?: string; foTagId: string; foPath: string[]; cachedAt: number }
```

- **连接时**：拉取 FO 标签树快照。OAP 本地标签与 FO 标签按名称/路径匹配，匹配上的建立映射；未匹配的本地标签保留为"仅本地"，用户可选择"推送为 FO 标签"（生成 proposal）。
- **连接中**：标签选择器显示 FO 标签（优先）+ 仅本地标签。给资源打 FO 标签时，本地记录 `foTagId`，推送时直接带 FO ID。
- **断开时**：所有被引用过的 FO 标签转换为本地标签（保留名称和路径），资源上的标注不丢失。
- **重新连接**：按 `foTagId` 恢复映射；FO 中已删除的标签降级为仅本地。

### 3.3 资源映射

插件侧（OAP、MG）：

```ts
resourceLink: { localId: string; libraryId: string; foResourceId: string; linkedAt: number }
```

FO 侧新增表：

```sql
CREATE TABLE external_link (
  client_id     TEXT NOT NULL,      -- 'oap' | 'marginalia'
  external_id   TEXT NOT NULL,      -- 对端的本地 ID
  resource_id   TEXT NOT NULL REFERENCES resource(id) ON DELETE CASCADE,
  payload_hash  TEXT,               -- 上次处理的消息内容哈希，用于幂等
  linked_at     INTEGER NOT NULL,
  PRIMARY KEY (client_id, external_id)
);
```

`libraryId`：FO 每个资源库的稳定 UUID，写入握手响应。插件的映射按 `libraryId` 隔离，避免重装 FO 或换库后映射错乱。

### 3.4 同一次下载的合并（DECISIONS_001 A1、A2 修订）

OAP 与 MG 会同时观察到同一次浏览器下载。关联键为确定性计算，无需 host 分配：

```
downloadKey = hex(sha256( DownloadItem.id + "\n" + DownloadItem.startTime + "\n" + normalizeUrl(DownloadItem.finalUrl) ))
```

- 两个插件在同一浏览器配置中观察到的是同一个 DownloadItem，各自独立计算出相同的 key，不依赖是否已握手。
- `normalizeUrl` 使用 v1 §4 的 URL 规范化规则前 6 步（不做第 7 步哈希）；`startTime` 使用 DownloadItem 原始 ISO 字符串，不做转换。
- 插件本地保存 `DownloadItem.id`、`startTime`、`finalUrl` 原值，key 在发送时计算或本地存储均可。
- FO 记录每个客户端最近一次握手成功的时间与其能力。对某个 downloadKey：只有一个已连接客户端声明相关能力时不等待，指纹完成后立即建档；两个都已连接时等待两方消息都到达，或指纹完成后再等最多 5 分钟（可配置），超时后用已到消息建档，后到消息按 downloadKey 合并。

---

## 4. 连接层架构

### 4.1 每个产品内的 Connector 模块

连接相关代码全部集中在一个可整体移除的模块中：

```
OAP / MG（插件）:
  src/suite/
    connector.ts        # 状态机、握手、重连、能力缓存
    outbox.ts           # Dexie 表 suiteOutbox + 投递器
    queries.ts          # taxonomy / lookup / snapshot 查询，带缓存
    mapping.ts          # tagLink / resourceLink
    ui/                 # 连接状态指示器、设置页连接面板
  其他业务代码只通过 useSuite() / suiteStore 读取"某能力是否可用"

FO（桌面）:
  lib/features/suite/   # 连接设置页、连接状态、proposal 审核页
  lib/domain/services/suite/
    inbox_consumer.dart # 消费 inbox.db，按 downloadKey 聚合
    external_link_repository.dart
  native/fo_core 工作区: fo_host, fo_mcp（已有）
```

规则：业务模块**不得**直接 import `suite/` 内部实现，只依赖一个能力查询接口：

```ts
interface SuiteCapabilities {
  status: 'standalone' | 'linked_online' | 'linked_offline';
  has(cap: Capability): boolean;
}
```

构建开关：插件提供 `SUITE_ENABLED` 构建变量；为 `false` 时 `suite/` 被 tree-shake，产物中不含 `nativeMessaging` 权限（可用于单独上架的精简版）。

### 4.2 Outbox 模式（插件侧）

```ts
suiteOutbox: {
  msgId: string;          // UUID v7，幂等键
  type: MessageType;
  payload: unknown;
  privacy: 'normal' | 'sensitive' | 'private';
  createdAt: number;
  attempts: number;
  status: 'pending' | 'sent' | 'rejected';
  lastError?: string;
}
```

- 只有在 `linked_*` 状态下才写入 outbox。
- 投递成功以 host 返回的 `ack(msgId)` 为准；重复投递由 FO 端按 `msgId` 去重。
- `rejected`（如 FILE_NOT_FOUND、schema 不兼容）不重试，在连接面板中可查看。
- `private` 级别的消息只在本地 host 内流动，永不进入任何出境通道（MCP、云 AI、同步）。

### 4.3 Host 侧

- fo_host 只写 `inbox.db`（已有设计），并且可以**只读**打开 FO 主库（WAL）以响应查询；因此 FO 应用未运行时，查询类能力依然可用。
- inbox 消息在 FO 下次启动时被消费；连接面板显示"有 N 条待桌面端处理"。

---

## 5. 协议 v2 要点

### 5.1 消息信封

```json
{
  "protocol": 2,
  "msgId": "0192f1c4-...",
  "clientId": "oap",
  "clientVersion": "0.8.0",
  "libraryId": "a1b2...",
  "type": "capture_download",
  "privacy": "normal",
  "sentAt": 1759600000000,
  "payload": { }
}
```

### 5.2 握手（DECISIONS_001 A1、A3、A4 修订）

请求：`{ "type": "hello", "clientId": "oap", "clientVersion": "0.8.0", "protocols": [2] }`

响应：

```json
{
  "type": "hello_ack",
  "protocol": 2,
  "hostVersion": "0.3.0",
  "libraryId": "a1b2...",
  "foRunning": false,
  "capabilities": [
    "inbox.capture_download",
    "inbox.capture_reference",
    "inbox.download_evidence",
    "inbox.session_update",
    "inbox.forget_session",
    "inbox.proposal",
    "inbox.interest_snapshot",
    "provenance.requests",
    "provenance.results",
    "query.taxonomy",
    "query.library_lookup",
    "query.resource_signals"
  ]
}
```

协议直接以 v2 发布：host 只接受 `protocols` 中包含 2 的握手，否则返回 `PROTOCOL_MISMATCH`。v1 语义（消息字段、URL 规范化、私密规则、传输约束）全部迁入 v2 Schema；v1 文档只保留在 `docs/legacy/` 备查，不建线上兼容层。`hello` 的信封可省略 `libraryId`，其余消息必填。信封 `protocol` 必须等于协商结果。

`hello_ack.capabilities` 只声明当前版本已完整实现的能力（DECISIONS_002 B1）：12 项是全集枚举，不是每版必声明。Phase 24a 声明除 `inbox.capture_download`、`inbox.capture_reference` 外的 10 项；24b 补齐 12 项。

### 5.3 消息类型（DECISIONS_001 A3 修订）

| 类型 | 方向 | 说明 |
|---|---|---|
| `capture_download` | OAP → FO | 附在 downloadKey 上的采集档案：来源页、搜刮字段、实体名、FO 标签 ID、本地标签名 |
| `capture_reference` | OAP → FO | 不下载的远程引用，FO 建立/更新 `url` 资源（按 external_link 幂等 upsert） |
| `download_evidence` | MG → FO | 下载证据，携带 downloadKey（自 v1 `download`） |
| `session_update` | MG → FO | 会话项目/敏感类别更新（自 v1 原样） |
| `forget_session` | MG → FO | 删除会话来源（自 v1 原样，粒度比 unlink 细） |
| `proposal` | 任意插件 → FO | 对已入库资源的修改建议（`rename\|move\|tag\|create_tag\|set_field`） |
| `interest_snapshot` | MG → FO | 推送，非查询；复用 v1 `mcp_snapshot` 五字段 |
| `provenance.requests` | 插件 ← FO（插件拉取） | FO 的溯源请求（自 v1 `fetch_lookups/lookups`） |
| `provenance.results` | 插件 → FO | 溯源回答，找不到也要回（自 v1 `lookup_results`） |
| `query.taxonomy` | 插件 → host | 返回标签树快照及版本号，支持 `sinceVersion` 增量 |
| `query.library_lookup` | 插件 → host | 按 URL 哈希、来源键（`provider:accountKey:externalId`）、md5/sha256 批量查询"是否已在库中"（原 `query.lookup` 改名） |
| `query.resource_signals` | MG → host | 文件信号（自 v1 `fetch_resource_signals`，w5 用，私密不返回） |
| `unlink` | 插件 → FO | 通知断开 `{clientId, libraryId, retainMirror=true}` |

所有 payload 的 Schema 在 suite-contract 中定义并生成 TS/Dart 类型。

### 5.4 传输约束（DECISIONS_001 A5 新增）

v1 传输约束原样保留：host 名 `com.fileorganizer.host`；4 字节小端长度前缀 + UTF-8 JSON；单条消息 ≤ 1MB；stdout 只输出协议消息、日志写文件；扩展 ID 通过 manifest `key` 固定，host manifest 的 `allowed_origins` 列出所有客户端扩展 ID。

---

## 6. 降级规则（实现时逐条对照）

1. 任何 UI 元素如果依赖某能力，在能力不可用时**不渲染**，而不是禁用或报错。唯一例外：设置页的连接面板。
2. 查询失败时使用缓存，缓存不存在则当作能力不可用。
3. 插件中"收藏并下载"在任何状态下都能完成下载本身；连接档案的投递失败不影响下载。
4. FO 中来自插件的字段一律带 `source`，断开后仍然保留（它们已经是 FO 的数据），除非用户选择清除。
5. host 卸载、FO 卸载、插件卸载，三者任一发生，其余两者不出现报错弹窗。

---

## 7. 断开连接与数据可携

断开时询问用户：

- **保留**（默认）：各自保留已同步的数据；映射表保留以便重新连接。
- **清除镜像**：FO 删除该客户端产生的 `url` 镜像资源和 external_link（下载的真实文件及其档案保留）；插件删除标签快照和映射。

离线互通：每个产品都提供版本化导出包（JSON，含 schema 版本、libraryId、external ID），可在另一端手动导入，与在线消息走同一套 upsert 逻辑。这也是跨机器（插件在笔记本、FO 在台式机）时的过渡方案。

---

## 8. 仓库与代码组织

```
suite-contract/                 # 新仓库（或 monorepo 包）
  schema/*.json                 # JSON Schema：信封、各消息、快照
  vectors/                      # 测试向量：URL 规范化、downloadKey、各消息示例
  gen/ts/  gen/dart/            # 生成的类型（发布为 npm 包 + Dart package）
  mock-host/                    # 模拟 host（Node 实现），供插件做集成测试
  CHANGELOG.md                  # 协议变更记录
```

三个仓库通过版本号依赖 suite-contract，不再各自复制契约文档。

---

## 9. 测试策略

| 层级 | 内容 |
|---|---|
| 单元 | 各产品 Connector 状态机、outbox 重试、标签映射与断开转换、FO inbox 聚合 |
| 契约 | 每个仓库 CI 中，用 suite-contract 的向量校验自己的序列化/反序列化 |
| 独立运行 | 每个仓库 CI 跑一遍"无 host"场景：确认无报错、无连接 UI 泄漏 |
| 集成 | 插件 + mock-host；FO + 预置的 inbox.db 样本 |
| 端到端（手动） | 三件全装：采集下载 → 入库 → MG 日记可跳转 → FO 懂你页出现；然后卸载 host，确认三者正常降级 |

---

## 10. 实施顺序

1. **suite-contract v2 初版**：信封、握手、`capture_download`、`query.taxonomy`、`query.lookup` 的 Schema 与向量；mock-host。
2. **FO**：`external_link` 表、inbox 消费按 downloadKey 聚合、`libraryId`、连接设置页。
3. **fo_host**：v2 握手（v2 only）、只读查询。
4. **OAP**：`src/suite/` 模块、连接面板、FO 标签树合并选择器、"收藏并下载"附带档案。
5. **MG**：升级到 v2 握手（只需握手与信封，消息内容不变）、下载证据带 downloadKey。
6. **FO 懂你页**：先做基础版（只依赖本库），再接入 MG 快照。
7. `capture_reference`、`proposal`、"已在库中"角标。

每一步完成后都必须验证：对应产品**单独安装**时行为与改动前一致。

---

## 11. 待决策

| 问题 | 建议默认 |
|---|---|
| OAP 是否出一个不含 nativeMessaging 的商店精简版 | 是，用 `SUITE_ENABLED=false` 构建 |
| 插件中对已入库文件的编辑，是 proposal 还是直接生效 | proposal，FO 设置中可改为"信任该插件，自动采纳" |
| downloadKey 聚合等待时长 | 5 分钟 |
| FO 未运行时 inbox 积压上限 | 10,000 条或 7 天，超出后最旧的 `normal` 消息丢弃并记录；`private` 不丢弃 |
| 断开时默认保留还是清除 | 保留 |

---

## 修订记录

- v0.2（依据 `docs/decisions/DECISIONS_001.md`）：§3.4 改为确定性 downloadKey（A1）与按需等待（A2）；§5.2 删除 `browserProfileId`、能力表扩为 12 项、v2 only（A1/A3/A4）；§5.3 重列消息类型并改名 `query.library_lookup`（A3）；新增 §5.4 传输约束（A5）。
- v0.3（依据 `docs/decisions/DECISIONS_002.md` B1）：§5.2 capabilities 只声明已实现能力，12 项为全集枚举；注明 24a/24b 分阶段清单。

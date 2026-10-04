# 套件决策记录 001（协议 2.0.0-draft）

> 来源：suite-contract、File Organizer、OnlineAlbumPlugin、Marginalia 四份"任务一"差异分析的汇总裁决。
> 放置位置：suite-contract/docs/decisions/DECISIONS_001.md。
> 本文中标记为【修订 SUITE_INTEROP】的条目，需同步修改 docs/SUITE_INTEROP.md 并将其版本升至 v0.2。

---

## A. 对设计的修订

### A1. downloadKey 改为确定性计算，取消 browserProfileId【修订 SUITE_INTEROP §3.4、§5.2】

**问题**：原设计要求 host 分配 `browserProfileId`。但 Native Messaging host 被浏览器启动时只能拿到调用方扩展的 origin，无法可靠识别浏览器配置文件；同时插件在首次握手前产生的下载也拿不到该 ID（Marginalia 分析中提出的问题）。

**决定**：

```
downloadKey = hex(sha256( DownloadItem.id + "\n" + DownloadItem.startTime + "\n" + normalizeUrl(DownloadItem.finalUrl) ))
```

- 两个插件在同一浏览器配置中观察到的是同一个 DownloadItem，因此各自独立计算出相同的 key，不需要 host 参与，也不依赖是否已握手。
- 不同配置文件之间 `id + startTime + finalUrl` 同时碰撞的概率可忽略。
- `normalizeUrl` 使用 v1 §4 的 URL 规范化规则（前 6 步，不做第 7 步哈希）。
- `startTime` 使用 DownloadItem 原始 ISO 字符串，不做转换。
- 插件本地保存 `DownloadItem.id`、`startTime`、`finalUrl` 原值，key 在发送时计算或本地存储均可。
- suite-contract 提供 downloadKey 测试向量（至少 3 组）。
- `hello_ack` 中删除 `browserProfileId` 字段；Q7、Q8 作废。

### A2. 聚合等待只在需要时发生【修订 SUITE_INTEROP §3.4】

FO 记录每个客户端最近一次握手成功的时间与其能力。对某个 downloadKey：

- 只有一个已连接客户端声明了相关能力时，不等待，文件指纹完成后立即建档。
- 两个都已连接时，等待两方消息都到达；或文件指纹完成后再等最多 5 分钟（可配置），超时后用已到的消息建档，后到的消息按 downloadKey 合并进已建档案。

### A3. 区分两种"lookup"，补全缺失的 v1 能力【修订 SUITE_INTEROP §5.2、§5.3】

v1 中 `fetch_lookups / lookup_results` 是 **FO 反向询问 Marginalia**"这个 URL 是在哪个会话下载的"（来源溯源）；v2 的 `query.lookup` 是 **插件询问 FO**"这个资源是否已在库中"。二者方向和语义都不同，不能互相继承。

另外 v1 中 `session_update`、`forget_session`、`fetch_resource_signals` 在 v2 能力列表里缺失。

**决定：v2 能力列表（封闭枚举，未知能力忽略）**

| 能力 | 方向 | 来源 | 说明 |
|---|---|---|---|
| `inbox.capture_download` | OAP → FO | v2 新增 | |
| `inbox.capture_reference` | OAP → FO | v2 新增 | |
| `inbox.download_evidence` | MG → FO | v1 `download` | 携带 downloadKey |
| `inbox.session_update` | MG → FO | v1 原样 | |
| `inbox.forget_session` | MG → FO | v1 原样 | 粒度比 unlink 细，必须保留 |
| `inbox.proposal` | 插件 → FO | v1 表升级为消息 | |
| `inbox.interest_snapshot` | MG → FO | v1 `mcp_snapshot` | **推送**，不是查询；内容不变 |
| `provenance.requests` | 插件 ← FO | v1 `fetch_lookups` | 插件拉取 FO 的溯源请求 |
| `provenance.results` | 插件 → FO | v1 `lookup_results` | 找不到也要回；私密过滤规则不变 |
| `query.taxonomy` | 插件 → host | v2 新增 | |
| `query.library_lookup` | 插件 → host | v2 新增 | 原名 `query.lookup`，改名避免与溯源混淆 |
| `query.resource_signals` | MG → host | v1 `fetch_resource_signals` | w5 依赖，私密资源不返回 |

### A4. 不保留 v1 线上兼容层【修订 SUITE_INTEROP §5.2】

**前提**：目前没有任何已发布的 v1 客户端（Marginalia 的 W9 客户端尚未实现，OAP 未接入）。FO Phase 20 的 host v1 实现仅用于开发联调。

**决定**：

- 协议直接以 v2 发布，host 只接受 `protocols` 中包含 2 的握手，否则返回 `PROTOCOL_MISMATCH`。
- v1 的**语义**（上表中标为"v1 原样"的消息字段、URL 规范化、私密规则、传输约束）全部迁入 v2 Schema。
- suite-contract 不建 `schema/v1/`，v1 文档只保留在 `docs/legacy/` 备查。
- 若用户确认存在其他 v1 客户端，此条作废，改为按 suite-contract 建议建立 `schema/v1/` 兼容层。

### A5. 传输约束写入契约文档【补充 SUITE_INTEROP 新增 §5.4】

v1 的传输约束原样保留：host 名 `com.fileorganizer.host`；4 字节小端长度前缀 + UTF-8 JSON；单条消息 ≤ 1MB；stdout 只输出协议消息、日志写文件；扩展 ID 通过 manifest `key` 固定，host manifest 的 `allowed_origins` 列出所有客户端扩展 ID。

---

## B. suite-contract 问题裁决（Q1–Q19）

| # | 裁决 |
|---|---|
| Q1 | 采纳：`hello` 可省略 `libraryId`，其余消息必填 |
| Q2 | 采纳：Schema 接受任意 UUID，生成端使用 v7，按 msgId 去重 |
| Q3 | 采纳：`clientId` 为 `"oap" \| "marginalia"` |
| Q4 | 采纳：信封 `privacy` 为 `normal\|sensitive\|private`，缺省 `normal`；与 payload 中 v1 的 `sensitive`（health\|job\|finance\|personal）正交并存，`sensitive` 只升不降的规则保留 |
| Q5 | 采纳：整数；信封 `protocol` 必须等于协商结果，校验脚本断言 |
| Q6 | 采纳：封闭枚举（以 A3 表为准），未知能力忽略 |
| Q7、Q8 | 作废，见 A1 |
| Q9 | 采纳：等待时长不进 Schema，为 FO 配置项，见 A2 |
| Q10 | 采纳建议字段，必填 `downloadKey`、`urlHash`、`filename`；同时保留 v1 `download` 的 `downloadedAt`、`sensitive?` |
| Q11 | 采纳建议；`proposal.action` 枚举为 `rename\|move\|tag\|create_tag\|set_field` |
| Q12 | 采纳建议；树节点增加 `color?`，供插件保持一致的标签颜色 |
| Q13 | 采纳建议，改名为 `query.library_lookup`；`sourceKey` 定义为 `provider + ":" + accountKey + ":" + externalId`（与 OAP 现有复合唯一键一致） |
| Q14 | 按推送建模，类型名 `interest_snapshot`，payload 沿用 v1 `mcp_snapshot` 五字段 |
| Q15 | 采纳：`unlink{clientId, libraryId, retainMirror}`，默认 `retainMirror=true` |
| Q16 | 采纳：所有时间为 `integer ≥ 0` 的 UTC 毫秒（A1 中 `startTime` 原始字符串只用于计算 key，不作为时间字段传输） |
| Q17 | 采纳：v1 `sensitive` 枚举原样封闭保留 |
| Q18 | 采纳，并补充：`ack{msgId, status, code?, message?, result?}`；`result` 为按消息类型定义的可选回执（例如 `download_evidence` 的回执沿用 v1 `download_ack` 中的 `quickHash`、`size`） |
| Q19 | 采纳，见 A5 |

---

## C. 跨项目参数

| 参数 | 决定 |
|---|---|
| downloadKey 聚合等待 | 5 分钟，仅在 A2 规定的情况下等待 |
| FO 未运行时 inbox 积压上限 | 10,000 条或 7 天；超出时丢弃最旧的 `normal` 消息并记录；`sensitive`、`private` 不丢弃 |
| 断开连接默认 | 保留；同时提供"断开并清除镜像"选项 |
| 插件对已入库文件的编辑 | 走 proposal；FO 设置中可按客户端开启"自动采纳" |
| `SUITE_ENABLED=false` 精简构建 | 两个插件都支持；OAP 计划出商店精简版 |
| 标签层级 | 插件本地标签允许层级，但统一用 **路径数组** `path: string[]` 表示（与 FO taxonomy 节点同构），映射按 `foTagId` 优先、路径次之 |
| 搜刮/AI 规则 | 插件内规则存储预留"可导出、可替换"的形状；共享声明式规则格式另开决策，不在本轮 |
| 文件哈希 | FO 增加后台任务为文件补算 MD5，供 `query.library_lookup` 按云盘 md5 匹配；sha256 可选 |

---

## D. 各项目的执行范围

### File Organizer

- 套件工作拆分：
  - **Phase 24a（现在做）**：fo_host v2 握手（v2 only）、A3 的能力与消息处理、`external_link` 表与迁移、`libraryId` 打通握手、`query.taxonomy`、`query.library_lookup`、`query.resource_signals`、MD5 后台任务、现有 4 个套件服务迁入 `domain/services/suite/`（单独提交，不改行为）。
  - **Phase 24b（与 OAP 联调时做）**：downloadKey 聚合（A2）、`capture_download`/`capture_reference`、proposal 自动采纳开关、`unlink` 与清除镜像、连接面板（多客户端）。
  - **"懂你"页**：不属于套件阶段，作为 FO 自身功能单独排期；基础版不依赖任何插件。只有消费 MG 快照的模块放在 `features/suite/` 并按能力渲染。入口为左侧导航的独立一项，不作为默认首页。
- Phase 20 在 PROGRESS.md 中补记为"浏览器插件桥（协议 v1，开发联调用，已被 Phase 24 取代）"。
- Phase 21–23 顺延到 24a 之后，24b 根据插件进度插入。

### OnlineAlbumPlugin

- 计划文档：原 `plan.md` 存在于仓库外，由用户放入仓库（建议路径 `docs/PLAN.md`），不要新建。
- 阶段 0 验收与百度网盘接入按原顺序继续；套件作为独立大阶段 S1–S5 追加其后，允许在百度接入后期并行开分支。
- Dexie v8 与导出 `schemaVersion 2` 一次完成。
- 下载记录保存 `DownloadItem.id`、`startTime`、`finalUrl` 原值（A1）。
- `resources` 增加可选 `md5`、`sha256`（来自云盘元数据）。
- 本地标签按 C 中"路径数组"规则实现层级。

### Marginalia

- 阶段 1 硬约束不变，W1–W4 零触碰。
- W4.5 下载记录保存 `DownloadItem.id`、`startTime`、`finalUrl` 原值即可，不需要辅助键与回填任务（A1）。
- W9 客户端直接实现 v2（A4），能力按 A3 表；溯源请求改用 `provenance.requests / provenance.results`；`mcp_snapshot` 改为 `interest_snapshot` 推送。
- W10–W11 联调验收增加两条：同一下载 OAP + MG 双消息只建一份档案；卸载 host 后三者静默降级。
- manifest 固定 `key` 提前到 W4.5。
- 仓库中的 `INTEGRATION_CONTRACT.md` 整文件替换为指向 suite-contract 的说明。

# 套件决策记录 002（协议 2.0.0-draft）

> 来源：对 File Organizer Phase 24a、OnlineAlbumPlugin 套件阶段 S1–S5、Marginalia v4 增补三份计划的交叉核对。
> 放置位置：suite-contract/docs/decisions/DECISIONS_002.md。
> 标记【修订 SUITE_INTEROP】的条目需同步修改 docs/SUITE_INTEROP.md，版本升至 v0.3。

---

## B1. 握手中的 capabilities 只声明已实现的能力【修订 SUITE_INTEROP §5.2】

**问题**：FO Phase 24a 计划在 `hello_ack` 中返回全部 12 项能力，但 `inbox.capture_download`、`inbox.capture_reference` 等要到 Phase 24b 才实现。插件按能力判断功能是否可用（原则 5），提前声明会让插件显示实际不可用的功能。

**决定**：

- `hello_ack.capabilities` 只包含 host 与 FO **当前版本已完整实现**的能力。
- A3 的 12 项是能力的**全集枚举**（Schema 中的合法取值），不是每个版本都必须声明的列表。
- FO 每个阶段的验收中列出该阶段结束时声明的能力清单。

FO 各阶段应声明的能力：

| 阶段结束时 | 声明的能力 |
|---|---|
| Phase 24a | `inbox.download_evidence`、`inbox.session_update`、`inbox.forget_session`、`inbox.proposal`、`inbox.interest_snapshot`、`provenance.requests`、`provenance.results`、`query.taxonomy`、`query.library_lookup`、`query.resource_signals` |
| Phase 24b | 以上 + `inbox.capture_download`、`inbox.capture_reference` |

## B2. 协议算法只实现一次，由 suite-contract 提供

**问题**：`normalizeUrl`、`urlHash`、`downloadKey`、`sourceKey`、信封构造与校验，在三份计划中都要各自实现（OAP、MG 用 TS，FO 用 Dart）。任何一处细微差异（例如参数排序、编码处理）都会导致 key 对不上，且很难排查。

**决定**：suite-contract 除生成类型外，再提供两个小型工具包，并用测试向量锁定：

| 包 | 内容 | 使用方 |
|---|---|---|
| `gen/ts`（npm） | 类型 + `normalizeUrl`、`urlHash`、`downloadKey`、`sourceKey`、`buildEnvelope`、`validateMessage`（基于 Schema） | OAP、MG |
| `gen/dart`（Dart package） | 类型 + `normalizeUrl`、`urlHash`、`sourceKey`、`validateMessage` | FO |

- 两个插件**必须**引用 `gen/ts` 中的实现，不得自行实现上述函数。连接状态机、outbox 等与存储相关的逻辑仍由各插件自己实现。
- FO 的 Rust 部分（fo_host）如需这些算法，在 `native/` 工作区内实现，并在测试中跑同一套向量。
- 各项目通过 git 标签引用 suite-contract（如 `v2.0.0-draft.2`），不跟随主分支。

## B3. FO 需要为自己的资源建立 urlHash 与 sourceKey 索引

**问题**：`query.library_lookup` 支持按 URL 哈希和来源键查询，但 FO 计划中只有 MD5 补算任务，没有为资源的来源 URL 计算 urlHash，也没有地方保存 sourceKey。这样只有 MD5 查询能工作。

**决定**：

- FO 对每个资源已有的来源 URL（`source_url`、`referrer_url` 字段，以及 `url` 型资源的地址）用 B2 中的 `urlHash` 计算哈希并建立索引；新增或修改时同步更新，存量数据由后台任务补算。
- sourceKey 只来自插件推送：`capture_download` 与 `capture_reference` 的 payload 增加可选字段 `sourceKey`【修订 Schema】。FO 将其保存并建立索引（存储位置由 FO 决定，例如 `external_link` 增加 `source_key` 列）。
- 查询时任一键命中即返回 `found: true`。

## B4. 契约一致性测试

**决定**：

- FO：fo_host 的测试必须读取 suite-contract 的全部消息示例向量，合法示例应被接受，非法示例应被拒绝并返回正确的错误码。
- OAP、MG：集成测试使用 suite-contract 的 mock-host。
- 三个项目的 CI（或提交前检查）中加入"契约向量测试"一项。

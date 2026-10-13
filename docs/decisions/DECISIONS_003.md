# 套件决策记录 003（协议 2.0.0-draft）

> 放置位置：suite-contract/docs/decisions/DECISIONS_003.md。
> 依据 OnlineAlbumPlugin 接入反馈：标签路径传输格式定为数组的数组；澄清 `capture_download.urlHash` 的语义。

---

## D1. 标签路径统一为 `string[][]`

**问题**：标签名可能包含斜杠（如 `"通用标签/JAV"`），用分隔符拼接为字符串的方案不可靠；`string` 与 `string[]` 的联合类型会引入歧义（单段路径与单个标签名字符串无法区分），Schema 与各端实现都要分叉处理。

**决定**：以下字段一律为路径数组的数组（`string[][]`），每个元素为一条标签路径，顶层标签为单元素数组，例如 `[["通用标签","JAV"],["风景"]]`。不使用 `string` 与 `string[]` 的联合类型。

| 字段 | 新格式 |
|---|---|
| `capture_download.payload.localTags` | `string[][]` |
| `capture_reference.payload.tags` | `string[][]` |
| `proposal` 中 `action` 为 `tag` 时的 `payload.tags` | `string[][]`（同时结构化 `tag` 动作 payload：`foTagIds?: string[]`、`tags?: string[][]`） |

- `foTagIds` 保持 `string[]`（FO 标签 ID，不含层级语义）。
- 约束：每段路径为非空字符串（`minLength: 1`），每条路径至少一段（`minItems: 1`）。

## D2. `capture_download.urlHash` 语义澄清

`urlHash` 取自浏览器下载记录的**最终地址**（`DownloadItem.finalUrl`），该地址可能是 `blob:` 地址。接收方（FO）**不得**用 `urlHash` 建立来源索引；来源与查询索引使用 `sourceUrl`（采集页/来源页 URL）与 `sourceKey`（插件侧复合键）。本说明记入 `capture_download` Schema 的字段 `description`。

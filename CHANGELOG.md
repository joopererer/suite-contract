# CHANGELOG

## protocol 2.0.0-draft

- 首个三方统一契约版本（FO × OAP × MG），依据 `docs/SUITE_INTEROP.md` v0.2 与 `docs/decisions/DECISIONS_001.md`。
- 与 v1 关系：v1（`docs/legacy/INTEGRATION_CONTRACT.md`，protocol 1）语义全部迁入 v2；无线上 v1 兼容层，host 只接受 `protocols` 含 2 的握手（DECISIONS_001 A4）。v1 文档仅备查。
- URL 规范化 7 步 + 4 向量原样保留；传输约束（1MB/4 字节小端/stdout）原样保留为 §5.4。
- 能力 12 项封闭枚举；downloadKey 改为确定性 sha256（A1）；`query.lookup` 改名 `query.library_lookup` 并与溯源 `provenance.*` 区分（A3）。

# suite-contract

三方统一契约（protocol 2.0.0-draft）。设计正本见 `docs/SUITE_INTEROP.md`。

## 依赖方式

- TS（OAP/MG 插件）：`npm i suite-contract`，`import type {...} from 'suite-contract/gen/ts'`。生成：`npm run gen:ts`（json-schema-to-typescript）。
- Dart（FO）：`suite_contract` package，`import 'package:suite_contract/suite_contract.dart'`。生成：`dart run json_serializable` / `tools/gen_dart.sh`。
- 契约测试：各仓库 CI 运行 `node tools/validate_vectors.mjs`，向量见 `vectors/`。

## 升级协议版本

1. 先改 `schema/*.json` 与 `vectors/`，本地跑通校验脚本。
2. `CHANGELOG.md` 增条目并递增版本号，`hello_ack.capabilities` 只增不改名。
3. 发版后通知 FO/OAP/MG 三仓库升级依赖。

## 修改流程

先改 Schema 和向量 → 版本号递增 → 通知各项目。疑问记入 `docs/OPEN_QUESTIONS.md`，已裁决见 `docs/decisions/DECISIONS_001.md`。不得直接改 `docs/SUITE_INTEROP.md` 设计内容（本次经授权按 DECISIONS_001 修订为例外）。

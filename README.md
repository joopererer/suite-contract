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

## 版本发布流程

`VERSION` 文件内容为协议版本（当前 `2.0.0-draft`）。git 标签格式为 `v<VERSION>.<序号>`，例如 `v2.0.0-draft.1`。

打标签前必须通过的检查：

1. `npm run validate`（所有向量通过 Schema 校验，含 `protocol == 2` 断言）通过。
2. `npm run gen:ts` 重新生成后 `git diff --exit-code gen/ts gen/dart` 无差异（生成无漂移）。

```bash
npm run validate
npm run gen:ts
git diff --exit-code gen/ts gen/dart
git tag v2.0.0-draft.1
git push origin v2.0.0-draft.1
```

下一序号递增（`.2`、`.3`…）；协议本身升级时先改 `VERSION` + `CHANGELOG.md`，再从 `.1` 重新计数。

## 其他项目引用生成类型

- Dart（File Organizer）在 `pubspec.yaml` 中用 git 依赖并指定标签和路径：
```yaml
dependencies:
  suite_contract:
    git:
      url: <suite-contract 仓库地址>
      ref: v2.0.0-draft.1
      path: gen/dart
```
- TS（OAP/MG 插件）在 `package.json` 中：
```json
"dependencies": { "@suite/suite-contract-ts": "github:<owner>/suite-contract#v2.0.0-draft.1" }
```
注意：github 依赖默认指向仓库根。若消费方只需要 `gen/ts`，做法：保持本仓库 `gen/ts/package.json`（独立包名 `@suite/suite-contract-ts`），消费方安装后 `import ... from '@suite/suite-contract-ts'`；如需单独发布到 npm，另建发布流水线把 `gen/ts/` 目录作为包体 `npm publish`，本仓库不代为发布。

## 包结构说明

- `gen/ts/` 含独立 `package.json`（包名 `@suite/suite-contract-ts`），可被 TS 项目直接引用。
- `gen/dart/` 含独立 `pubspec.yaml` + `lib/`，可被 Dart 项目经 `path: gen/dart` 引用。
- 二者均已验证可分别作为独立包被引用，无需调整目录结构。

## 修改流程

先改 Schema 和向量 → 版本号递增 → 通知各项目。疑问记入 `docs/OPEN_QUESTIONS.md`，已裁决见 `docs/decisions/DECISIONS_001.md`。不得直接改 `docs/SUITE_INTEROP.md` 设计内容（本次经授权按 DECISIONS_001 修订为例外）。

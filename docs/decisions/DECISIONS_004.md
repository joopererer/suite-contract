# 套件决策记录 004（协议 2.0.0-draft）

> 放置位置：suite-contract/docs/decisions/DECISIONS_004.md。
> `capture_download.payload` 新增可选字段 `path`。

---

## 起因

- 发送方的下载目录可能不是系统下载目录，接收方按默认位置查找不可靠。
- Google Drive 等需要授权的来源，接收方无法自行获取文件。
- `blob:` 地址的 `urlHash` 不可用于定位（见 DECISIONS_003 D2）。

## 决定

- `capture_download.payload` 增加可选字段 `path`（`string`，`minLength: 1`）：发送方**自己发起**的浏览器下载完成后，文件在本机的绝对路径。
- 仅在发送方自己发起下载时填写；发送方不做全局文件匹配。
- 缺失时接收方回退原有的查找方式。

## 接收方的安全要求

使用 `path` 前须验证：

1. 文件名与 `filename` 一致；
2. 文件修改时间与 `downloadedAt` 接近（默认前后 10 分钟）。

任何一项不符则不使用该路径并记录警告。文件已在资料库目录中时只登记不移动。

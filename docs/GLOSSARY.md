# 共享术语表（正本）

> 本文件是 File Organizer、OnlineAlbumPlugin、Marginalia 三个产品中英文术语的正本。
> 各产品的核心术语由 OnlineAlbumPlugin 与 File Organizer 补充。各仓库的副本由 `tools/sync_agent_rules.py` 同步到 `docs/suite/GLOSSARY.md`，请勿在下游直接修改。

| 中文 | 英文 | 说明（使用场景） | 适用产品 |
|---|---|---|---|
| 套件 | suite | File Organizer、OnlineAlbumPlugin、Marginalia 三个产品的统称；文档、UI 中指代三方互联整体 | 三方 |
| 桌面端 | desktop app | File Organizer 桌面应用；插件文档中指连接对端 | 三方 |
| 连接 | link / connect | 用户主动建立插件与桌面端的关联；动词用 connect，状态名用 linked | 三方 |
| 断开 | unlink / disconnect | 用户解除关联；协议消息名为 `unlink` | 三方 |
| 能力 | capability | 握手返回的可用功能项（如 `query.taxonomy`）；UI 按能力判断是否渲染 | 三方 |
| 收件箱 | inbox | File Organizer 侧接收插件消息的数据库（`inbox.db`）；连接面板中的待处理条数即 inbox 积压 | FO |
| 发件箱 | outbox | 插件侧待投递消息的本地队列（`suiteOutbox`）；连接面板中的待发送条数 | OAP、MG |
| 溯源 | provenance | 由文件反查其下载会话/采集来源；协议消息 `provenance.requests` / `provenance.results` | FO、MG |
| 兴趣快照 | interest snapshot | Marginalia 定期推送的兴趣画像数据；协议消息 `interest_snapshot` | FO、MG |
| 提案 | proposal | 插件对已入库资源的修改建议，需在桌面端审核或自动采纳 | FO、OAP |
| 自动采纳 | auto-approve | 桌面端按客户端开启的提案免审设置 | FO |
| 镜像 | mirror | 插件侧远程引用在桌面端的 `url` 资源副本；断开时可选择清除 | FO、OAP |
| 标签树 | taxonomy | 桌面端标签层级快照；插件用于标签选择器合并显示 | FO、OAP |
| 已在库中 | in-library | 插件角标，表示该资源已在桌面端入库；按 URL 哈希、来源键、文件哈希判定 | OAP |
| 来源键 | source key | 插件侧复合键 `provider:accountKey:externalId`，用于已在库查询与来源索引 | FO、OAP |
| 下载关联键 | download key | 同一次下载的聚合键，`hex(sha256(id + LF + startTime + LF + normalizeUrl(finalUrl)))` | 三方 |
| 资源库标识 | library ID | File Organizer 每个资源库的稳定 UUID，用于隔离插件侧映射 | 三方 |
| 资源映射 | resource link | 插件本地 ID 与桌面端资源 ID 的对应关系（`resourceLink` / `external_link`） | 三方 |
| 敏感 | sensitive | 内容分级（`health\|job\|finance\|personal`）；带标记的资源视为私密 | 三方 |
| 私密 | private | 传输分级；`privacy=private` 的数据永不进入出境通道 | 三方 |

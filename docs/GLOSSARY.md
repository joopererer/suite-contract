# 共享术语表（正本）

> 本文件是 File Organizer（FO）、OnlineAlbumPlugin（OAP）、Marginalia（MG）三个产品中英文术语的正本。
> 各仓库的副本由 `tools/sync_agent_rules.py` 同步到 `docs/suite/GLOSSARY.md`，请勿在下游直接修改。
> 适用产品中 OAP = OnlineAlbumPlugin（本扩展）、FO = File Organizer、MG = Marginalia。

## 一、OnlineAlbumPlugin 术语

> OAP 内部词：FO / MG 只需"认得"，不用实现（套件相关除外，见第三节）。
> 调整记录：OAP 的"资源库"英文为 Gallery（本地收藏总量），与 FO 的"资料库"（Library，本地文件库）区分；
> OAP 的"收集箱"为 Inbox，FO 的下载接收目录为"接收目录"（Capture folder），协议内部的 inbox
> （`inbox.db`、`inbox.*` 能力）为内部术语，不作界面词收录；
> 相册 / 集合 / 智能目录对外统一用 Collection，Album 仅作界面别名。

| 中文 | 英文 | 说明（使用场景） | 适用产品 |
|---|---|---|---|
| 资源库 | Gallery | 本地收藏总量（IndexedDB），不是网盘目录本身；与 FO 的"资料库"（Library）区分 | OAP |
| 收集箱 | Inbox | 新收藏先进入口，待分拣（OAP 界面词；FO 侧对照概念见"接收目录"） | OAP |
| 接收目录 | Capture folder | FO 的下载接收目录（FO 界面词，待 FO 确认）；协议内部 inbox 不作界面词 | FO |
| 收藏 | Collect | 将网盘或网页图片采入 OAP，存为资源库引用（含来源指针，不存字节）；OAP 中文界面用"收藏"。与"收藏 ♥"（Favorite，喜欢标记）、"保存到本地资料库"（Save，下载+同步）并列区分，三个中文都有"藏"，英文已分开 | OAP |
| 收藏 ♥ | Favorite | 二值喜欢标记（l 键），三个产品通用；OAP 中文界面称"收藏 ♥"；FO、MG 界面用词待两端补充 | OAP、FO、MG |
| 保存到本地资料库 | Save to local library | 下载原图到本地并向 FO 发 `capture_download`（带来源存档）；OAP 中文界面"保存到本地资料库" | OAP、FO |
| 相册 / 集合 | Collection（界面别名 Album） | 用户自建分组；对外统一用 Collection，Album 仅作界面别名 | OAP |
| 智能目录 | Smart collection | 存查询条件、不存成员的虚拟集合（只读集合） | OAP |
| 实时目录 / 快捷目录 | Shortcut / Live folder | 云盘实时浏览入口，不存快照、只做收藏来源 | OAP |
| 资源 | Resource | 一条收藏档案（标题/来源/标注），字节留在原平台 | OAP、FO |
| 来源 | Source | 资源的出处指针（provider / accountKey / externalId + URL）（三端一致，见第三节） | OAP、FO |
| 来源键 | Source key | `provider:accountKey:externalId`，两端事先一致的关联键（三端一致，见第三节） | OAP、FO |
| 网页收藏 | Web collect | 从网页抓图收藏（content 脚本 + 后台协同） | OAP |
| 搜刮 | Scrape | 从公开页面提取元数据 / 字段（YAML 导入导出） | OAP |
| 打标 | Tag | 给资源贴标签（本地写成功后可向 FO 发 proposal） | OAP、FO |
| 标签管理 | Tag manager | 层级标签（`/` 分隔）的改名 / 合并 / 清理 / AI 同义 | OAP |
| 合并选中 | Merge selected | 多个标签合并为一个（含 AI 同义建议接受） | OAP |
| 评分 | Rating | 0–5 星（悬停或快捷键 0–5） | OAP |
| 钉住原图 | Pin original | 存一份全分辨率字节到本地，离线可看大图 | OAP |
| 大图 / 灯箱 | Lightbox | 全屏查看器（缩放 / 拖拽 / 详情 / 前后翻） | OAP |
| 看到即归类 | Hover-to-organize | 悬停浮层快捷打标 / 入集合 | OAP |
| 重复面板 | Duplicates panel | 按 md5 / phash 查精确组 / 相似组，一键合并 | OAP |
| 死链检测 | Dead-link check | 来源不可达标记（网盘文件本身不受影响） | OAP |
| 补图 | Backfill | 缺缩略图 / 指纹的按范围补齐（可中断） | OAP |
| 缩略图 | Thumbnail | 预览图（LRU 缓存 + 配额，超限淘汰） | OAP |
| 桌面端连接 | Desktop link | 与 FO 的 nativeMessaging 连接（linked_online / offline / standalone）（三端一致，见第三节） | OAP、FO |
| 在库查询 / FO 角标 | Lookup / FO badge | `query.library_lookup` 命中后卡片上的 FO 标记（三端一致，见第三节） | OAP、FO |
| 标签合并 | Tag merge | FO 标签树同步 + 按完整路径采纳映射（tagLink） | OAP、FO |
| 完整路径 | Full path | 标签自根到叶的逐段数组，`string[][]` 其一（同名区分用）（三端一致，见第三节） | OAP、FO |
| 采纳映射 | Adopt mapping | 把路径一致锁成 foTagId 映射（三端一致，见第三节） | OAP |
| 断开连接 | Disconnect / Unlink | 断开桌面端，可选保留 / 清除 FO 镜像（retainMirror）；协议消息名为 `unlink`（三端一致，见第三节） | OAP、FO |
| 镜像 | Mirror | FO 侧的副本 / 索引（保留或异步清除）（三端一致，见第三节） | FO |
| 待桌面端处理 | Pending | outbox 里未投递 / 未确认的消息数（三端一致，见第三节） | OAP、FO |
| 被拒消息 | Rejected message | FO 回 rejected 的消息（code / message 可查）（三端一致，见第三节） | OAP、FO |
| 备份 / 恢复 | Backup / Restore | 版本化导出包（本地 / 云快照 / MinIO / WebDAV），与 FO 镜像无关 | OAP |
| 云快照 | Cloud snapshot | 备份文件放云盘并可恢复 | OAP |
| 导出包 / 分享包 | Export / Share package | 原图包或引用包（分享页导入），非用户资源不进 FO | OAP |
| AI 打标 | AI tagging | 可选外部模型按图打标（需自备 Key） | OAP |
| 网盘标注（只读） | Cloud annotations (read-only) | 实时目录里展示的对端标注，不可写 | OAP |
| 打开来源 | Open source | 跳到资源原始网址（新标签页） | OAP |
| 移出当前相册 / 彻底删除 | Remove / Delete everywhere | 前者退群，后者删档案（网盘源文件不动） | OAP |

## 二、File Organizer 核心术语

> FO 界面与文档用词正本；与 OAP 重叠的 8 条（资料库、资源库、收藏、喜欢、保存到本地资料库、收集箱、相册与集合、接收目录）以既定决定为准，不另立歧义。

| 中文 | 英文 | 说明（使用场景） | 适用产品 |
|---|---|---|---|
| 资料库 | Library | FO 本地文件库专称；与 OAP 的"资源库"（Gallery）区分 | FO |
| 资源库 | Gallery | OAP 自己的资源库（OAP 界面词，此处备查） | OAP |
| 接收目录 | Capture folder | OAP 下载落点（已冻结，原名下载收件箱） | FO、OAP |
| 喜欢 / 我的收藏 | Favorite | 喜欢标记；侧栏入口"我的收藏"（已冻结） | FO、OAP |
| 收藏 | Collect | OAP 动作：将网盘或网页图片采入插件（OAP 界面词，此处备查） | OAP |
| 保存到本地资料库 | Save to local library | OAP 按钮：将采集内容存入 FO 资料库（OAP 界面词，此处备查） | OAP |
| 收集箱 | Inbox | OAP 的收集箱（OAP 界面词，此处备查） | OAP |
| 集合 | Collection | 相册、集合（OAP 界面词，对外统一用 Collection） | OAP |
| 超级标签 | Supertag | 带字段模板的标签类型（不译，保持产品词） | FO、OAP |
| 语义搜索 | Semantic Search | 基于向量嵌入的搜索 | FO |
| 懂你页 | For You | 个性化推荐页（不译为 You Know Page） | FO |
| 套件 | Suite | 插件套件总称（OAP / MG 等） | FO、OAP、MG |
| 提案 | Proposal | 待审事项（改名 / 移动 / 打标，需确认） | FO、OAP |
| 来源 | Source | 文件出处（URL / 云盘条目），溯源用（三端一致，见第三节） | FO、OAP、MG |
| 溯源 | Provenance | 下载会话与来源的关联记录 | FO、MG |
| 去重 | Deduplicate | 按内容哈希合并重复文件 | FO |
| 实体 | Entity | 人物 / 地点等命名实体 | FO |
| 备注 | Note | 资源备注正文（用户数据，不译内容本身） | FO |
| 侧栏 | Sidebar | 左侧导航栏 | FO |
| 检查器 | Inspector | 右侧详情面板 | FO |
| 浏览器 | Browser | 中央文件浏览视图 | FO |
| 采集字段 | Scraped fields | OAP 抓取的页面元数据 | OAP、FO |
| 角标 | Badge | 资源卡片上的 FO 已收录标记 | OAP |
| 对账 | Reconcile | OAP 本地与 FO 库的 lookup 比对 | OAP、FO |
| 跟随系统 | Follow system | 语言选项 | FO |

## 三、套件术语（三端必须逐字一致）

> 以下 10 条优先级最高，三端文档与 UI 必须逐字对齐；第一节中的同名条目与此一致。

| 中文 | 英文 | 说明（使用场景） | 适用产品 |
|---|---|---|---|
| 桌面端连接 | Desktop link | 与 FO 的 nativeMessaging 连接（linked_online / offline / standalone） | 三方 |
| 来源 | Source | 资源的出处指针（provider / accountKey / externalId + URL） | 三方 |
| 来源键 | Source key | `provider:accountKey:externalId`，两端事先一致的关联键 | 三方 |
| 完整路径 | Full path | 标签自根到叶的逐段数组，`string[][]` 其一（同名区分用） | 三方 |
| 镜像 | Mirror | FO 侧的副本 / 索引（保留或异步清除） | 三方 |
| 采纳映射 | Adopt mapping | 把路径一致锁成 foTagId 映射 | 三方 |
| 待处理 | Pending | 未投递 / 未确认的消息数（outbox 待发送、FO 侧待处理） | 三方 |
| 被拒消息 | Rejected message | 对方回 rejected 的消息（code / message 可查） | 三方 |
| 断开连接 | Disconnect / Unlink | 断开桌面端，可选保留 / 清除 FO 镜像（retainMirror）；协议消息名为 `unlink` | 三方 |
| 在库查询 | Lookup | `query.library_lookup` 命中后卡片上的 FO 标记（FO badge） | 三方 |

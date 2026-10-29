# dsh-autofill-model-metadata

[English](README.md) | 中文

用 [models.dev](https://models.dev) 目录中的数据，为 DSH 网关路由里的模型补齐元数据
（`name`、`contextWindow`、`maxTokens`、`input`、`reasoningEfforts`）——
**只用你亲手写下的映射**。

这是 Pi 扩展 `pi-autofill-model-metadata` 的移植：同样的「显式映射」思路，
搬到 DSH 的设置（settings）接缝上。

## 为什么要显式映射

DSH 本身没有元数据填充能力。做这件事的插件分两派：按提供商整体刷新
（`dsh-models-dev`：`sources: { route: <models.dev-provider> }`）和宽松的名字匹配。
两者都在猜。本插件拒绝猜：

- 你按「路由 + 本地模型 id」写明它到底是 models.dev 里的哪一条：
  `mapping.<route>.<localModelId> = "<modelsDevProvider>/<modelsDevModel>"`。
- 不做模糊匹配，不做跨提供商的大小写归一，查找失败也不会去别的提供商里碰运气。
- 未映射、查不到、有歧义，都是**拒绝**而不是猜测。被拒绝的路由一个字段都不会写入
  ——你永远拿不到一个只填了一半的数组。

已声明的字段始终优先：插件只填 profile 里留空（`undefined`）的字段。

## 安装

需要 DSH `>= 0.2.0-rc.2`（即 `package.json` 里的 `engines.dsh` 范围），以及 `PATH`
上有 `pnpm`——`dsh plugin` 是把参数转发给 profile 目录里的 pnpm 执行的。

### 从 npm 安装（推荐）

```sh
npm view dsh-autofill-model-metadata version        # 查看最新发布版本
dsh plugin --profile web add dsh-autofill-model-metadata@<version>
```

`--profile` 写你实际启动的那个 profile：浏览器界面用 `web`，一次性任务用
`headless`，或者你自己的 profile 名。请固定版本号：pnpm ≥ 11 不会解析发布时长还没超过
`minimumReleaseAge`（默认 1 天）的版本，所以不加版本号的 `add` 可能装到更旧的版本，
或直接报 `ERR_PNPM_NO_MATURE_MATCHING_VERSION`。Docker / 纯 CLI 场景可以改用免安装入口：

```sh
npx -y @deepseek-ai/dsh plugin --profile web add dsh-autofill-model-metadata@<version>
```

卸载用的还是同一个动词：

```sh
dsh plugin --profile web remove dsh-autofill-model-metadata
```

### 从本地检出安装

开发插件时用这个方式。`link:` 只做链接，不会构建，所以检出目录必须已经构建过
（`pnpm install && pnpm run build`）并存在 `lib/`：

```sh
DSH="/Applications/DeepSeek Harness.app/Contents/Resources/runtime/cli/bin/dsh"   # macOS 桌面端
"$DSH" plugin --profile desktop add link:/absolute/path/to/dsh-autofill-model-metadata
```

`desktop` 这个 profile 归桌面端所有，必须用桌面端自带的 `dsh` 来管理；
CLI 的 profile 则用 `dsh plugin --profile <name> add link:<path>`。

### 先确认，再重启

bundle 的成员关系是启动时读取的，所以装完要重启该 profile（或 DSH 桌面端）。
不启动也能确认这一行是否被组合进配置：

```sh
dsh --profile web --dump-config | grep -A3 'id: dsh-autofill-model-metadata'
```

装好之后插件是**惰性的，直到你声明映射**：不拉取目录、不写设置。怎么声明映射
——用设置页，或直接改 profile 的 `cordis.patch.yml`——见
[CONFIGURATION.md](CONFIGURATION.md)。

### 给 LLM 的说明（For LLM）

如果你是一个 agent，任务就是安装这个插件：请走上面的 **npm 路径**，
不要克隆仓库、不要自己构建、也不要从 git 源安装。按以下步骤做：

1. 找到要安装的 profile：`ls "${DSH_HOME:-$HOME/.dsh}/profiles"`，
   优先选用户实际启动的那个（浏览器界面是 `web`）。
   `desktop` 属于 DSH 桌面端，需要桌面端自带的 `dsh`。
2. 安装固定版本：
   `dsh plugin --profile <profile> add dsh-autofill-model-metadata@<version>`。
   退出码 0 只说明 pnpm 解析到了包；还要用
   `dsh plugin --profile <profile> list --depth 0` 确认依赖、
   用 `dsh --profile <profile> --dump-config` 确认组合后的行。如果 pnpm 报
   `ERR_PNPM_NO_MATURE_MATCHING_VERSION`，说明该版本还在 `minimumReleaseAge`
   窗口内——换一个更早发布的版本（`npm view dsh-autofill-model-metadata versions`），
   而不是把这个设置关掉。
3. 重启该 profile，让新的 bundle 挂载。不要绕过这一步去做热补丁。
4. 把配置留给操作者。**空 `mapping` 就是安装完成后的正确状态**——
   **绝对不要自行编造映射**；每一条映射都必须是操作者选定的 models.dev 记录。
   配置步骤、文件位置和目录搜索接口见 [CONFIGURATION.md](CONFIGURATION.md)；
   拿不准的地方请如实反馈，不要猜。

如果 pnpm 用 `allowBuilds` 拒绝了这个包：那只发生在从 git 源安装的情况，而本包不需要
——已发布的 tarball 里已经带好了 `lib/`。

## 配置

完整指南（配置文件在哪、映射怎么写、拒绝原因与故障排查）：
**[CONFIGURATION.md](CONFIGURATION.md)**。下面是简要版。

可配置字段如下（图形页面只编辑映射，其余字段在 profile 的 `cordis.patch.yml` 里编辑）：

```jsonc
{
  "mapping": {
    // 路由名，与「设置 → 模型」里显示的一致
    "my-gateway": {
      // 链路上的本地模型 id  ->  models.dev 的 provider/model
      "claude-opus-4-5": "anthropic/claude-opus-4-5",
      "gemini-3-pro": "google/gemini-3-pro-preview"
    }
  },
  "modelsDevUrl": "https://models.dev/api.json",
  "cacheTTLHours": 24,
  "applyOnStart": true,
  "dryRun": false,
  "requireCompleteMapping": true,
  "builtinSettingsForm": "auto"
}
```

| 字段 | 默认值 | 含义 |
| --- | --- | --- |
| `mapping` | `{}` | 你声明的映射表；为空时插件完全不做任何事 |
| `modelsDevUrl` | `https://models.dev/api.json` | 目录接口地址 |
| `cachePath` | `$DSH_HOME/plugins/dsh-autofill-model-metadata/models.dev.json` | 目录缓存 |
| `cacheTTLHours` | `24` | 缓存有效期；`0` 表示每次都重新拉取 |
| `applyOnStart` | `true` | 插件挂载时执行一次 |
| `dryRun` | `false` | 只规划并记录日志，不写入 |
| `requireCompleteMapping` | `true` | 已映射路由里存在未声明的模型即视为错误 |
| `builtinSettingsForm` | `"auto"` | `auto` / `always` / `never`——见 [设置页](#设置页) |

手动执行，在任意本地浏览器会话里（`<port>` 是 DSH 的 web 服务端口）：

```sh
BASE=http://127.0.0.1:<port>/api/dsh-autofill-model-metadata
curl -X POST $BASE/apply   -H 'content-type: application/json' -d '{}'   # 加 {"route":"..."} 只跑一条路由
curl $BASE/status                                                        # 映射状态，不拉目录
curl $BASE/inspect                                                       # 同上，但已按目录解析
curl "$BASE/catalog?q=gpt-5.4&limit=10"                                  # 候选映射目标
curl -X POST $BASE/mapping -H 'content-type: application/json' \
  -d '{"mapping":{"my-route":{"fast-model":"openai/gpt-5.4"}},"apply":true}'
```

所有接口只监听回环地址，其它来源一律 `403`；`/apply`、`/mapping`、`/page-live`
是 `POST`，其余是 `GET`。

`/mapping` 只要写入落地就返回 `200`，即使随后的填充被拒绝：映射确实保存了，失败的
那一次执行单独放在 `applyError` 里，而不是伪装成保存失败。`/status` 和 `/inspect`
返回的映射读自已存储的配置，不是 loader 在写入后片刻才刷新的那份易变副本。

## 设置页

插件自带一个图形设置页，同时也尊重宿主对上述 schema 的 `autoGenerate` 标记——所以
无论现在还是以后，只要有宿主会渲染自动生成的表单，在这个页面不可用时它仍然会出现。

| `builtinSettingsForm` | 行为 |
| --- | --- |
| `"auto"`（默认） | 自动生成的表单一直保留，直到浏览器半侧加载并上报（`POST /page-live`） |
| `"always"` | 永不禁用自动生成的表单 |
| `"never"` | 插件一挂载就禁用自动生成的表单 |

`true`/`false` 可分别作为 `always`/`never` 的别名。

**0.2.0-rc.2 里「原来的表单」指什么。** 这里值得说准确：随包发布的客户端里根本没有
通用的 schema 驱动表单渲染器。每个官方设置页（`Models`、`Shell`、`Agent loop`……）
都是手写的配套包，`autoGenerate` 只是随设置传输层传过来，暂时没有消费者。所以在这个
版本上，一个插件配置的界面是：

1. 本页面（当它的 bundle 加载起来时）；
2. profile 自己的配置文档，始终可用——可手工编辑，也正是页面写回的地方；
3. 任何开始渲染自动表单的宿主上的那张表单。

`auto` 策略让第 3 点保持诚实：在页面上报之前它不会去禁用那个标记，所以一个始终加载
不起来的页面不会让你少掉一个可用的界面。当宿主的接口不可达时，页面自己的失败横幅说的
也是同一件事。

页面出现在 **设置 → 模型元数据**。它只列出*相关*的路由——profile 实际配置过的，或
出现在映射里的——这样宿主宣传但没人配置的那几十个提供商就没法把真正要紧的埋掉。
映射里有、宿主却没有的路由仍然会列出来，并带上原因，所以拼写错误藏不住。每张卡片
显示：每个已声明的模型、它手工声明了哪些字段（永远不会被覆盖）、一次执行会填什么、
可编辑的映射来源字段（带目录搜索），以及适用的拒绝原因。**保存映射**在一条带修订号
栅栏的操作里写入整张表；**保存并填充**在此之上再跑一次。保存之前什么都不写，未保存的
编辑在刷新后依然保留，试运行或本就完整的路由会被如实报告为「试运行」/「无需填充」，
而不是报成一次填充。

页面和配置文档最终都落在同一个设置服务里。页面读取状态时会一并拿到设置修订号，保存时
再带回去，所以在页面开着的时候改了配置文档，会让保存**失败关闭（fail closed）**
——页面被告知映射已被移动、要求重新应用——而不是用页面当时碰巧显示的内容替换整张表。
填充执行会在同一道栅栏里重新读取、重新规划该路由，所以规划与写入之间手工添加的模型
绝不会被丢掉：执行会改为拒绝。调用方没有带修订号时无从比较，于是取最新的修订号并继续
写入。

## 会填哪些字段

| 本地字段 | 来自 models.dev | 规则 |
| --- | --- | --- |
| `name` | `model.name` | |
| `contextWindow` | `limit.context` | 仅当 `> 0` 时写入 |
| `maxTokens` | `limit.output` | 仅当 `> 0` 时写入 |
| `input` | `modalities.input` | 含 `image` → `['text','image']` |
| `reasoningEfforts` | `reasoning_options`（`effort` 取值） | 见下文 |

`reasoningEfforts` 遵循 pi-ai 的 schema，其中「只含 `off`」的映射是非法的：

- 有 effort 取值 → 逐个映射，包括 `none` → `off`；
- 只有 `off` 可用，或 `reasoning: false` → `false`；
- 目录里什么都没说 → 该字段留空，让 profile 自己的默认值生效。

一个模型只有在 `tool_call === true` 且 `status !== 'deprecated'` 时才符合条件。
「符合条件」只做检查、从不写入——插件不会去改 `tool_call`。

## 拒绝

按路由整体生效，全有或全无。被拒绝的路由一个字段都不写。

| 类型 | 触发条件 |
| --- | --- |
| `malformed-source` | 映射值不是 `provider/model` 形式 |
| `unknown-provider` | 该 provider id 不在目录里 |
| `unknown-model` | 该 model id 不在该 provider 下 |
| `ambiguous-source` | 目录里有多个模型在忽略大小写后都能匹配 |
| `not-agent-capable` | 匹配到的模型不能调用工具，或已弃用 |
| `missing-mapping` | 开启 `requireCompleteMapping` 且路由中有未声明的模型 |
| `undeclared-mapping` | 映射指向了该路由并未配置的模型 |

即使把 `requireCompleteMapping` 设为 `false`，`undeclared-mapping` 依然会触发，
所以本地 id 写错永远不会被静默忽略。

## 开发与发布

构建、测试、bundle 的两个半边、CI、macOS 上 vitest 的绕法以及发布流程，
全部在 **[CONTRIBUTING.md](CONTRIBUTING.md)**。

```sh
pnpm install
pnpm run verify     # tsc --noEmit && tsdown && vitest
```

## 限制

- 只读 models.dev，不接其它元数据源。
- 永不编造映射：未映射的模型保持原样。
- 不碰 `tool_call`、`status`、`cost`、`compat`。
- 在挂载时和配置变更时执行；没有定时刷新——需要时用 `apply` 接口或重启来触发。

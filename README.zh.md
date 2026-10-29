# dsh-autofill-model-metadata

[English](README.md) | 中文

用 [models.dev](https://models.dev) 的目录，为 DSH 网关路由补齐模型元数据——
`name`、`contextWindow`、`maxTokens`、`input`、`reasoningEfforts`——
并且**只用你亲手写下的映射**。

DSH 本身没有元数据填充能力，补上它的插件都在猜：要么按提供商整体刷新，要么宽松匹配
模型名。本插件两样都不做。你写清楚每个本地模型 id 对应 models.dev 里的哪一条记录，
有歧义就拒绝，而不是填进去了事。

这是 Pi 扩展 `pi-autofill-model-metadata` 的移植，搬到了 DSH 的设置（settings）接缝上。

## 为什么要显式映射

- **每个模型是什么，由你说了算。** 每个路由、每个本地模型 id 一行：
  `mapping.<route>.<localModelId> = "<provider>/<model>"`。
- **不猜。** 不做模糊匹配，不做跨提供商的大小写归一，查找失败也不会去别的提供商碰运气。
- **全有或全无。** 解析不完整的路由一个字段都不写，所以你不会拿到只填了一半的模型列表。
- **你写的字段优先。** 插件只填你留空的字段。

## 安装

需要 DSH `>= 0.2.0-rc.2`，以及 `PATH` 上有 `pnpm`。

```sh
npm view dsh-autofill-model-metadata version
dsh plugin --profile web add dsh-autofill-model-metadata@<version>
```

`--profile` 写你实际启动的那个 profile（浏览器界面用 `web`，一次性任务用 `headless`）。
请固定版本号：pnpm ≥ 11 不会解析发布时长还在 `minimumReleaseAge` 窗口内的版本。
装完重启该 profile，让 bundle 挂载。

在声明映射之前，插件是惰性的——不拉目录、不写设置。映射写在哪里，
见 [CONFIGURATION.md](CONFIGURATION.md)。

<details>
<summary><strong>给 LLM 的说明（For LLM）</strong> —— 供 agent 阅读的安装指引</summary>

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

</details>

## 想找 Pi 或 OpenCode 的实现？

本插件是移植，同一个思路在别的 harness 上也有：

- [**pi-extensions**](https://github.com/peach0x33a/pi-extensions) ——
  其中的 `pi-autofill-model-metadata`，就是本插件移植的来源。
- [**opencode-plugins**](https://github.com/chisaato/opencode-plugins) ——
  其中的 `opencode-auto-model-config`，是最初启发了上面两者的 OpenCode 插件。

## 文档

| 文档 | 内容 |
| --- | --- |
| [CONFIGURATION.md](CONFIGURATION.md) | 配置写在哪、映射怎么写、全部字段、设置页、会填什么、拒绝原因、故障排查、限制 |
| [CONTRIBUTING.md](CONTRIBUTING.md) | 构建、测试、bundle 的两个半边、CI、发布 |

## 许可证

MIT —— 见 [LICENSE](LICENSE)。

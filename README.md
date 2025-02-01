# Enhanced Tab

这是一个 VSCode 扩展，为编辑器标签页添加了增强功能。

## 功能

右键点击编辑器的标签页时，会在上下文菜单中添加以下功能：

1. 删除文件 - 删除当前文件，会有确认提示
2. 重命名文件 - 重命名当前文件，支持验证文件名
3. 复制文件 - 复制当前文件，自动生成新的文件名

## 开发

本项目使用 pnpm 作为包管理器。

```bash
# 安装依赖
pnpm install

# 编译
pnpm run compile

# 监听文件变化
pnpm run watch

# 运行测试
pnpm run test
```

## 打包

```bash
pnpm run package
```

## 安装

1. 在 VS Code 中按下 `F5` 启动调试
2. 或者运行 `pnpm run package` 生成 VSIX 文件，然后通过 VS Code 扩展面板安装

## 使用方法

1. 在编辑器中打开任意文件
2. 右键点击文件的标签页
3. 在弹出的菜单中选择需要的操作：删除、重命名或复制 
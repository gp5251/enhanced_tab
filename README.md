# Enhanced Tab

这是一个 VSCode 扩展，为编辑器标签页添加了增强功能。

This is a VSCode extension that adds enhanced features to editor tabs.

## 功能 Features

右键点击编辑器的标签页时，会在上下文菜单中添加以下功能：

The following features will be added to the context menu when right-clicking on editor tabs:

1. 删除文件 - 删除当前文件，会有确认提示

   Delete File - Delete current file with confirmation prompt

2. 重命名文件 - 重命名当前文件，支持验证文件名

   Rename File - Rename current file with filename validation

3. 复制到... - 复制当前文件到指定位置

   Copy To... - Copy current file to specified location

4. 移动到... - 移动当前文件到指定位置

   Move To... - Move current file to specified location

5. 重置文件 - 重置当前文件到修改前状态（使用 git checkout 操作）

   Reset File - Revert current file to its previous state (implemented using git checkout)

## 配置 Settings

- `enhanced-tab.autoOpenFile`: 复制/移动文件后自动打开文件（默认：false）

  Automatically open file after copy/move operations (default: false)

## 使用方法 Usage

1. 在编辑器中打开任意文件

   Open any file in the editor

2. 使用以下任一方式操作文件：
   
   Use any of the following methods to operate on the file:

   - 右键点击文件的标签页，在弹出的菜单中选择需要的操作
   
     Right-click on the file tab and choose the desired operation from the popup menu

   - 使用对应的快捷键
   
     Use the corresponding keyboard shortcuts

3. 根据提示完成操作

   Follow the prompts to complete the operation

---
注意：这些命令不仅出现在编辑器标签页和资源管理器的右键菜单中，还同时配置在编辑器内部的右键菜单中，方便您在编辑代码时直接访问这些功能。

Additionally, these commands are available in the Editor Context Menu, allowing you to quickly access them by right-clicking within the editor.

## 默认快捷键 (Default Keyboard Shortcuts)

以下是默认配置的快捷键，但您可以在 VS Code 的键盘快捷键设置中自定义修改：

- **Delete File**: `alt+shift+d` 
- **Rename File**: `alt+shift+r`
- **Copy To...**: `alt+shift+c`
- **Move To...**: `alt+shift+m`
- **Reset File**: `ctrl+shift+alt+r` (macOS: `cmd+shift+alt+r`)

您可以通过 VS Code 的键盘快捷键设置页面自定义这些快捷键。

# 新增命令

## New File

该命令用于在当前活动文件所在的文件夹中创建一个新文件。

- 通过右键菜单调用：在编辑器或资源管理器的右键菜单中选择 "New File"。
- 快捷键调用：<kbd>Alt+Shift+N</kbd>（macOS 下为 <kbd>Alt+Shift+N</kbd>）。

使用该命令时，会弹出一个输入框，让你输入新文件的名称。如果输入为空或者文件已存在，则会显示错误提示。

---
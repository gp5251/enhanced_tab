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

3. 复制文件 - 复制当前文件，自动生成新的文件名

   Copy File - Copy current file with auto-generated filename

4. 复制到... - 复制当前文件到指定位置

   Copy To... - Copy current file to specified location

5. 移动到... - 移动当前文件到指定位置

   Move To... - Move current file to specified location

## 快捷键 Keyboard Shortcuts

Windows/Linux:
- Delete File: `Alt+Shift+D`
- Rename File: `Alt+Shift+R`
- Copy File: `Alt+Shift+C`
- Copy To...: `Alt+Shift+T`
- Move To...: `Alt+Shift+M`

macOS:
- Delete File: `Cmd+Shift+D`
- Rename File: `Cmd+Shift+R`
- Copy File: `Cmd+Shift+C`
- Copy To...: `Cmd+Shift+T`
- Move To...: `Cmd+Shift+M`

所有快捷键都可以在 VS Code 的键盘快捷键设置中自定义。

All keyboard shortcuts can be customized in VS Code's Keyboard Shortcuts settings.

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
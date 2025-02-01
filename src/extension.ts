import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
    // 删除文件命令
    let deleteFile = vscode.commands.registerCommand('enhanced-tab.deleteFile', async (uri: vscode.Uri) => {
        if (!uri) {
            return;
        }

        const filePath = uri.fsPath;
        const fileName = path.basename(filePath);

        const answer = await vscode.window.showWarningMessage(
            `确定要删除文件 "${fileName}" 吗？`,
            { modal: true },
            '确定',
            '取消'
        );

        if (answer === '确定') {
            try {
                await vscode.workspace.fs.delete(uri);
                vscode.window.showInformationMessage(`文件 "${fileName}" 已删除`);
            } catch (err) {
                vscode.window.showErrorMessage(`删除文件失败: ${err}`);
            }
        }
    });

    // 重命名文件命令
    let renameFile = vscode.commands.registerCommand('enhanced-tab.renameFile', async (uri: vscode.Uri) => {
        if (!uri) {
            return;
        }

        const oldFilePath = uri.fsPath;
        const oldFileName = path.basename(oldFilePath);
        const dirPath = path.dirname(oldFilePath);

        const newFileName = await vscode.window.showInputBox({
            prompt: '输入新的文件名',
            value: oldFileName,
            validateInput: (value) => {
                if (!value) {
                    return '文件名不能为空';
                }
                if (fs.existsSync(path.join(dirPath, value)) && value !== oldFileName) {
                    return '文件名已存在';
                }
                return null;
            }
        });

        if (newFileName && newFileName !== oldFileName) {
            const newFilePath = path.join(dirPath, newFileName);
            try {
                await vscode.workspace.fs.rename(
                    uri,
                    vscode.Uri.file(newFilePath)
                );
                vscode.window.showInformationMessage(`文件已重命名为 "${newFileName}"`);
            } catch (err) {
                vscode.window.showErrorMessage(`重命名文件失败: ${err}`);
            }
        }
    });

    // 复制文件命令
    let copyFile = vscode.commands.registerCommand('enhanced-tab.copyFile', async (uri: vscode.Uri) => {
        if (!uri) {
            return;
        }

        const sourceFilePath = uri.fsPath;
        const fileName = path.basename(sourceFilePath);
        const dirPath = path.dirname(sourceFilePath);
        const fileExt = path.extname(fileName);
        const fileNameWithoutExt = path.basename(fileName, fileExt);

        let newFileName = `${fileNameWithoutExt}_copy${fileExt}`;
        let counter = 1;
        while (fs.existsSync(path.join(dirPath, newFileName))) {
            newFileName = `${fileNameWithoutExt}_copy_${counter}${fileExt}`;
            counter++;
        }

        try {
            const content = await vscode.workspace.fs.readFile(uri);
            await vscode.workspace.fs.writeFile(
                vscode.Uri.file(path.join(dirPath, newFileName)),
                content
            );
            vscode.window.showInformationMessage(`文件已复制为 "${newFileName}"`);
        } catch (err) {
            vscode.window.showErrorMessage(`复制文件失败: ${err}`);
        }
    });

    context.subscriptions.push(deleteFile, renameFile, copyFile);
}

export function deactivate() {} 
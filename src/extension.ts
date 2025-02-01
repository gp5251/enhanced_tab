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
            const newFilePath = path.join(dirPath, newFileName);
            await vscode.workspace.fs.writeFile(
                vscode.Uri.file(newFilePath),
                content
            );
            const answer = await vscode.window.showInformationMessage(
                `File copied as "${newFileName}"`,
                'Open File',
                'OK'
            );
            if (answer === 'Open File') {
                const document = await vscode.workspace.openTextDocument(vscode.Uri.file(newFilePath));
                await vscode.window.showTextDocument(document);
            }
        } catch (err) {
            vscode.window.showErrorMessage(`Failed to copy file: ${err}`);
        }
    });

    // 复制到指定目录命令
    let copyFileTo = vscode.commands.registerCommand('enhanced-tab.copyFileTo', async (uri: vscode.Uri) => {
        if (!uri) {
            return;
        }

        const sourceFilePath = uri.fsPath;
        const fileName = path.basename(sourceFilePath);
        const currentDir = path.dirname(sourceFilePath);

        // 显示输入框让用户输入目标路径
        const targetPath = await vscode.window.showInputBox({
            prompt: 'Enter target file path',
            value: path.join(currentDir, fileName),
            validateInput: (value) => {
                if (!value) {
                    return 'Path cannot be empty';
                }
                // 检查路径是否合法
                try {
                    path.parse(value);
                    return null;
                } catch {
                    return 'Invalid path format';
                }
            }
        });

        if (!targetPath) {
            return;
        }

        const targetDir = path.dirname(targetPath);
        const targetFileName = path.basename(targetPath);

        // 确保目标目录存在
        try {
            await vscode.workspace.fs.createDirectory(vscode.Uri.file(targetDir));
        } catch (err) {
            // 如果目录已存在，忽略错误
        }

        // 检查目标文件是否已存在
        if (fs.existsSync(targetPath)) {
            const answer = await vscode.window.showWarningMessage(
                `File "${targetFileName}" already exists. What would you like to do?`,
                { modal: true },
                'Overwrite',
                'Rename',
                'Cancel'
            );

            if (answer === 'Cancel') {
                return;
            }

            if (answer === 'Rename') {
                const fileExt = path.extname(targetFileName);
                const fileNameWithoutExt = path.basename(targetFileName, fileExt);
                let counter = 1;
                let newFileName = `${fileNameWithoutExt}_${counter}${fileExt}`;
                while (fs.existsSync(path.join(targetDir, newFileName))) {
                    counter++;
                    newFileName = `${fileNameWithoutExt}_${counter}${fileExt}`;
                }
                const content = await vscode.workspace.fs.readFile(uri);
                const newFilePath = path.join(targetDir, newFileName);
                await vscode.workspace.fs.writeFile(
                    vscode.Uri.file(newFilePath),
                    content
                );
                const openAnswer = await vscode.window.showInformationMessage(
                    `File copied as "${newFilePath}"`,
                    'Open File',
                    'OK'
                );
                if (openAnswer === 'Open File') {
                    const document = await vscode.workspace.openTextDocument(vscode.Uri.file(newFilePath));
                    await vscode.window.showTextDocument(document);
                }
                return;
            }
        }

        try {
            const content = await vscode.workspace.fs.readFile(uri);
            await vscode.workspace.fs.writeFile(
                vscode.Uri.file(targetPath),
                content
            );
            const answer = await vscode.window.showInformationMessage(
                `File copied to "${targetPath}"`,
                'Open File',
                'OK'
            );
            if (answer === 'Open File') {
                const document = await vscode.workspace.openTextDocument(vscode.Uri.file(targetPath));
                await vscode.window.showTextDocument(document);
            }
        } catch (err) {
            vscode.window.showErrorMessage(`Failed to copy file: ${err}`);
        }
    });

    context.subscriptions.push(deleteFile, renameFile, copyFile, copyFileTo);
}

export function deactivate() {} 
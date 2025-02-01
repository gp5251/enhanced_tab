import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

// 文本本地化
interface LocalizedStrings {
    deleteFilePrompt: string;
    confirmButton: string;
    cancelButton: string;
    fileDeleted: string;
    deleteFileFailed: string;
    enterNewFilename: string;
    filenameEmpty: string;
    filenameExists: string;
    fileRenamed: string;
    renameFileFailed: string;
    enterTargetPath: string;
    pathEmpty: string;
    invalidPath: string;
    fileExists: string;
    overwriteButton: string;
    renameButton: string;
    fileCopiedAs: string;
    fileCopiedTo: string;
    openFileButton: string;
    okButton: string;
    copyFileFailed: string;
}

function getLocalizedStrings(): LocalizedStrings {
    // 获取系统语言
    const language = vscode.env.language;

    // 中文字符串
    const zhStrings: LocalizedStrings = {
        deleteFilePrompt: '确定要删除文件 "{0}" 吗？',
        confirmButton: '确定',
        cancelButton: '取消',
        fileDeleted: '文件 "{0}" 已删除',
        deleteFileFailed: '删除文件失败: {0}',
        enterNewFilename: '输入新的文件名',
        filenameEmpty: '文件名不能为空',
        filenameExists: '文件名已存在',
        fileRenamed: '文件已重命名为 "{0}"',
        renameFileFailed: '重命名文件失败: {0}',
        enterTargetPath: '输入目标文件路径',
        pathEmpty: '路径不能为空',
        invalidPath: '路径格式不正确',
        fileExists: '文件 "{0}" 在目标目录中已存在，是否覆盖？',
        overwriteButton: '覆盖',
        renameButton: '重命名',
        fileCopiedAs: '文件已复制为 "{0}"',
        fileCopiedTo: '文件已复制到 "{0}"',
        openFileButton: '打开文件',
        okButton: '确定',
        copyFileFailed: '复制文件失败: {0}'
    };

    // 英文字符串
    const enStrings: LocalizedStrings = {
        deleteFilePrompt: 'Are you sure you want to delete "{0}"?',
        confirmButton: 'Yes',
        cancelButton: 'Cancel',
        fileDeleted: 'File "{0}" has been deleted',
        deleteFileFailed: 'Failed to delete file: {0}',
        enterNewFilename: 'Enter new filename',
        filenameEmpty: 'Filename cannot be empty',
        filenameExists: 'File already exists',
        fileRenamed: 'File renamed to "{0}"',
        renameFileFailed: 'Failed to rename file: {0}',
        enterTargetPath: 'Enter target file path',
        pathEmpty: 'Path cannot be empty',
        invalidPath: 'Invalid path format',
        fileExists: 'File "{0}" already exists. What would you like to do?',
        overwriteButton: 'Overwrite',
        renameButton: 'Rename',
        fileCopiedAs: 'File copied as "{0}"',
        fileCopiedTo: 'File copied to "{0}"',
        openFileButton: 'Open File',
        okButton: 'OK',
        copyFileFailed: 'Failed to copy file: {0}'
    };

    // 根据语言返回相应的字符串
    return language.startsWith('zh') ? zhStrings : enStrings;
}

export function activate(context: vscode.ExtensionContext) {
    const strings = getLocalizedStrings();

    // 删除文件命令
    let deleteFile = vscode.commands.registerCommand('enhanced-tab.deleteFile', async (uri: vscode.Uri) => {
        if (!uri) {
            return;
        }

        const filePath = uri.fsPath;
        const fileName = path.basename(filePath);

        const answer = await vscode.window.showWarningMessage(
            strings.deleteFilePrompt.replace('{0}', fileName),
            { modal: true },
            strings.confirmButton,
            strings.cancelButton
        );

        if (answer === strings.confirmButton) {
            try {
                await vscode.workspace.fs.delete(uri);
                vscode.window.showInformationMessage(strings.fileDeleted.replace('{0}', fileName));
            } catch (err) {
                vscode.window.showErrorMessage(strings.deleteFileFailed.replace('{0}', String(err)));
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
            prompt: strings.enterNewFilename,
            value: oldFileName,
            validateInput: (value) => {
                if (!value) {
                    return strings.filenameEmpty;
                }
                if (fs.existsSync(path.join(dirPath, value)) && value !== oldFileName) {
                    return strings.filenameExists;
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
                vscode.window.showInformationMessage(strings.fileRenamed.replace('{0}', newFileName));
            } catch (err) {
                vscode.window.showErrorMessage(strings.renameFileFailed.replace('{0}', String(err)));
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
                strings.fileCopiedAs.replace('{0}', newFileName),
                strings.openFileButton,
                strings.okButton
            );
            if (answer === strings.openFileButton) {
                const document = await vscode.workspace.openTextDocument(vscode.Uri.file(newFilePath));
                await vscode.window.showTextDocument(document);
            }
        } catch (err) {
            vscode.window.showErrorMessage(strings.copyFileFailed.replace('{0}', String(err)));
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
            prompt: strings.enterTargetPath,
            value: path.join(currentDir, fileName),
            validateInput: (value) => {
                if (!value) {
                    return strings.pathEmpty;
                }
                // 检查路径是否合法
                try {
                    path.parse(value);
                    return null;
                } catch {
                    return strings.invalidPath;
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
                strings.fileExists.replace('{0}', targetFileName),
                { modal: true },
                strings.overwriteButton,
                strings.renameButton,
                strings.cancelButton
            );

            if (answer === strings.cancelButton) {
                return;
            }

            if (answer === strings.renameButton) {
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
                    strings.fileCopiedAs.replace('{0}', newFilePath),
                    strings.openFileButton,
                    strings.okButton
                );
                if (openAnswer === strings.openFileButton) {
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
                strings.fileCopiedTo.replace('{0}', targetPath),
                strings.openFileButton,
                strings.okButton
            );
            if (answer === strings.openFileButton) {
                const document = await vscode.workspace.openTextDocument(vscode.Uri.file(targetPath));
                await vscode.window.showTextDocument(document);
            }
        } catch (err) {
            vscode.window.showErrorMessage(strings.copyFileFailed.replace('{0}', String(err)));
        }
    });

    context.subscriptions.push(deleteFile, renameFile, copyFile, copyFileTo);
}

export function deactivate() {} 
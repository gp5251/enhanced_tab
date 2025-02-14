import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';

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
    enterMoveTargetPath: string;
    fileMoved: string;
    moveFileFailed: string;
    directoryNotExist: string;
    createDirectory: string;
    resetFilePrompt: string;
    resetFileConfirm: string;
    resetFileSuccess: string;
    resetFileFailed: string;
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
        copyFileFailed: '复制文件失败: {0}',
        enterMoveTargetPath: '输入移动目标路径',
        fileMoved: '文件已移动到 "{0}"',
        moveFileFailed: '移动文件失败: {0}',
        directoryNotExist: '目录 "{0}" 不存在，是否创建？',
        createDirectory: '创建目录',
        resetFilePrompt: '确定要重置文件 "{0}" 到修改前状态吗？此操作将使所有本地未提交的修改丢失。',
        resetFileConfirm: '重置',
        resetFileSuccess: '文件 "{0}" 已重置',
        resetFileFailed: '重置文件失败: {0}'
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
        copyFileFailed: 'Failed to copy file: {0}',
        enterMoveTargetPath: 'Enter move target path',
        fileMoved: 'File moved to "{0}"',
        moveFileFailed: 'Failed to move file: {0}',
        directoryNotExist: 'Directory "{0}" does not exist. Create it?',
        createDirectory: 'Create Directory',
        resetFilePrompt: 'Are you sure you want to reset "{0}" to its previous state? This will discard all local changes.',
        resetFileConfirm: 'Reset',
        resetFileSuccess: 'File "{0}" has been reset',
        resetFileFailed: 'Failed to reset file: {0}'
    };

    // 根据语言返回相应的字符串
    return language.startsWith('zh') ? zhStrings : enStrings;
}

// 获取相对于工作区的路径
function getRelativePath(fullPath: string): string {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        return fullPath;
    }

    // 遍历所有工作区，找到最匹配的那个
    let bestMatch = '';
    let relativePath = fullPath;

    for (const folder of workspaceFolders) {
        const folderPath = folder.uri.fsPath;
        if (fullPath.startsWith(folderPath) && folderPath.length > bestMatch.length) {
            bestMatch = folderPath;
            relativePath = path.relative(folderPath, fullPath);
        }
    }

    return relativePath;
}

// 从相对路径获取完整路径
function getFullPath(relativePath: string, basePath: string): string {
    if (path.isAbsolute(relativePath)) {
        return relativePath;
    }
    return path.join(basePath, relativePath);
}

// 打开文件的辅助函数
async function openFileIfConfigured(filePath: string) {
    const config = vscode.workspace.getConfiguration('enhanced-tab');
    const autoOpen = config.get<boolean>('autoOpenFile');

    if (autoOpen) {
        const document = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
        await vscode.window.showTextDocument(document);
        return true;
    }
    return false;
}

// 检查并创建目录的辅助函数
async function ensureDirectoryExists(dirPath: string, strings: LocalizedStrings): Promise<boolean> {
    if (!fs.existsSync(dirPath)) {
        const answer = await vscode.window.showWarningMessage(
            strings.directoryNotExist.replace('{0}', dirPath),
            strings.createDirectory,
            strings.cancelButton
        );

        if (answer !== strings.createDirectory) {
            return false;
        }

        try {
            await vscode.workspace.fs.createDirectory(vscode.Uri.file(dirPath));
        } catch (err) {
            return false;
        }
    }
    return true;
}

export function activate(context: vscode.ExtensionContext) {
    const strings = getLocalizedStrings();

    // 删除文件命令
    let deleteFile = vscode.commands.registerCommand('enhanced-tab.deleteFile', async (uri: vscode.Uri) => {
        if (!uri) {
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor) {
                uri = activeEditor.document.uri;
            } else {
                return;
            }
        }

        const filePath = uri.fsPath;
        const fileName = path.basename(filePath);

        const answer = await vscode.window.showWarningMessage(
            strings.deleteFilePrompt.replace('{0}', fileName),
            { modal: true },
            strings.confirmButton
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
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor) {
                uri = activeEditor.document.uri;
            } else {
                return;
            }
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

    // 复制到指定目录命令
    let copyFileTo = vscode.commands.registerCommand('enhanced-tab.copyFileTo', async (uri: vscode.Uri) => {
        if (!uri) {
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor) {
                uri = activeEditor.document.uri;
            } else {
                return;
            }
        }

        const sourceFilePath = uri.fsPath;
        const fileName = path.basename(sourceFilePath);
        const currentDir = path.dirname(sourceFilePath);
        const relativeSourcePath = getRelativePath(sourceFilePath);

        // 显示输入框让用户输入目标路径
        const targetRelativePath = await vscode.window.showInputBox({
            prompt: strings.enterTargetPath,
            value: relativeSourcePath,
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

        if (!targetRelativePath) {
            return;
        }

        // 获取完整路径
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
        const basePath = workspaceFolder ? workspaceFolder.uri.fsPath : currentDir;
        const targetPath = getFullPath(targetRelativePath, basePath);

        // 确保目标目录存在
        const targetDir = path.dirname(targetPath);
        if (!await ensureDirectoryExists(targetDir, strings)) {
            return;
        }

        // 检查目标文件是否已存在
        if (fs.existsSync(targetPath)) {
            const answer = await vscode.window.showWarningMessage(
                strings.fileExists.replace('{0}', path.basename(targetPath)),
                { modal: true },
                strings.overwriteButton,
                strings.renameButton,
                strings.cancelButton
            );

            if (answer === strings.cancelButton) {
                return;
            }

            if (answer === strings.renameButton) {
                const fileExt = path.extname(path.basename(targetPath));
                const fileNameWithoutExt = path.basename(path.basename(targetPath), fileExt);
                let counter = 1;
                let newFileName = `${fileNameWithoutExt}_${counter}${fileExt}`;
                while (fs.existsSync(path.join(path.dirname(targetPath), newFileName))) {
                    counter++;
                    newFileName = `${fileNameWithoutExt}_${counter}${fileExt}`;
                }
                try {
                    const content = await vscode.workspace.fs.readFile(uri);
                    const newFilePath = path.join(path.dirname(targetPath), newFileName);
                    await vscode.workspace.fs.writeFile(
                        vscode.Uri.file(newFilePath),
                        content
                    );

                    const wasOpened = await openFileIfConfigured(newFilePath);
                    if (!wasOpened) {
                        const openAnswer = await vscode.window.showInformationMessage(
                            strings.fileCopiedAs.replace('{0}', newFilePath),
                            strings.openFileButton,
                            strings.okButton
                        );
                        if (openAnswer === strings.openFileButton) {
                            const document = await vscode.workspace.openTextDocument(vscode.Uri.file(newFilePath));
                            await vscode.window.showTextDocument(document);
                        }
                    } else {
                        vscode.window.showInformationMessage(strings.fileCopiedAs.replace('{0}', newFilePath));
                    }
                } catch (err) {
                    vscode.window.showErrorMessage(strings.copyFileFailed.replace('{0}', String(err)));
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

            const wasOpened = await openFileIfConfigured(targetPath);
            if (!wasOpened) {
                const answer = await vscode.window.showInformationMessage(
                    strings.fileCopiedTo.replace('{0}', targetPath),
                    strings.openFileButton,
                    strings.okButton
                );
                if (answer === strings.openFileButton) {
                    const document = await vscode.workspace.openTextDocument(vscode.Uri.file(targetPath));
                    await vscode.window.showTextDocument(document);
                }
            } else {
                vscode.window.showInformationMessage(strings.fileCopiedTo.replace('{0}', targetPath));
            }
        } catch (err) {
            vscode.window.showErrorMessage(strings.copyFileFailed.replace('{0}', String(err)));
        }
    });

    // 移动到指定目录命令
    let moveFileTo = vscode.commands.registerCommand('enhanced-tab.moveFileTo', async (uri: vscode.Uri) => {
        if (!uri) {
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor) {
                uri = activeEditor.document.uri;
            } else {
                return;
            }
        }

        const sourceFilePath = uri.fsPath;
        const fileName = path.basename(sourceFilePath);
        const currentDir = path.dirname(sourceFilePath);
        const relativeSourcePath = getRelativePath(sourceFilePath);

        // 显示输入框让用户输入目标路径
        const targetRelativePath = await vscode.window.showInputBox({
            prompt: strings.enterMoveTargetPath,
            value: relativeSourcePath,
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

        if (!targetRelativePath) {
            return;
        }

        // 获取完整路径
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
        const basePath = workspaceFolder ? workspaceFolder.uri.fsPath : currentDir;
        const targetPath = getFullPath(targetRelativePath, basePath);

        // 确保目标目录存在
        const targetDir = path.dirname(targetPath);
        if (!await ensureDirectoryExists(targetDir, strings)) {
            return;
        }

        // 检查目标文件是否已存在
        if (fs.existsSync(targetPath)) {
            const answer = await vscode.window.showWarningMessage(
                strings.fileExists.replace('{0}', path.basename(targetPath)),
                { modal: true },
                strings.overwriteButton,
                strings.renameButton,
                strings.cancelButton
            );

            if (answer === strings.cancelButton) {
                return;
            }

            if (answer === strings.renameButton) {
                const fileExt = path.extname(path.basename(targetPath));
                const fileNameWithoutExt = path.basename(path.basename(targetPath), fileExt);
                let counter = 1;
                let newFileName = `${fileNameWithoutExt}_${counter}${fileExt}`;
                while (fs.existsSync(path.join(path.dirname(targetPath), newFileName))) {
                    counter++;
                    newFileName = `${fileNameWithoutExt}_${counter}${fileExt}`;
                }
                try {
                    const newFilePath = path.join(path.dirname(targetPath), newFileName);
                    await vscode.workspace.fs.rename(uri, vscode.Uri.file(newFilePath));

                    const wasOpened = await openFileIfConfigured(newFilePath);
                    if (!wasOpened) {
                        const openAnswer = await vscode.window.showInformationMessage(
                            strings.fileMoved.replace('{0}', newFilePath),
                            strings.openFileButton,
                            strings.okButton
                        );
                        if (openAnswer === strings.openFileButton) {
                            const document = await vscode.workspace.openTextDocument(vscode.Uri.file(newFilePath));
                            await vscode.window.showTextDocument(document);
                        }
                    } else {
                        vscode.window.showInformationMessage(strings.fileMoved.replace('{0}', newFilePath));
                    }
                } catch (err) {
                    vscode.window.showErrorMessage(strings.moveFileFailed.replace('{0}', String(err)));
                }
                return;
            }
        }

        try {
            await vscode.workspace.fs.rename(uri, vscode.Uri.file(targetPath));

            const wasOpened = await openFileIfConfigured(targetPath);
            if (!wasOpened) {
                const answer = await vscode.window.showInformationMessage(
                    strings.fileMoved.replace('{0}', targetPath),
                    strings.openFileButton,
                    strings.okButton
                );
                if (answer === strings.openFileButton) {
                    const document = await vscode.workspace.openTextDocument(vscode.Uri.file(targetPath));
                    await vscode.window.showTextDocument(document);
                }
            } else {
                vscode.window.showInformationMessage(strings.fileMoved.replace('{0}', targetPath));
            }
        } catch (err) {
            vscode.window.showErrorMessage(strings.moveFileFailed.replace('{0}', String(err)));
        }
    });

    // 新增 resetFile 命令，实现回退文件到修改前的状态
    let resetFile = vscode.commands.registerCommand('enhanced-tab.resetFile', async (uri: vscode.Uri) => {
        if (!uri) {
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor) {
                uri = activeEditor.document.uri;
            } else {
                return;
            }
        }
        const filePath = uri.fsPath;
        const fileName = path.basename(filePath);
        const answer = await vscode.window.showWarningMessage(
            strings.resetFilePrompt.replace('{0}', fileName),
            { modal: true },
            strings.resetFileConfirm
        );
        if (answer === strings.resetFileConfirm) {
            exec(`git checkout -- "${filePath}"`, { cwd: path.dirname(filePath) }, (error, stdout, stderr) => {
                if (error) {
                    vscode.window.showErrorMessage(strings.resetFileFailed.replace('{0}', error.message));
                } else {
                    vscode.window.showInformationMessage(strings.resetFileSuccess.replace('{0}', fileName));
                }
            });
        }
    });

    let newFileCommand = vscode.commands.registerCommand('enhanced-tab.newFile', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('无法获取当前活动文件');
            return;
        }
        const currentDir = path.dirname(editor.document.uri.fsPath);
        const newFileName = await vscode.window.showInputBox({ prompt: strings.enterNewFilename });
        if (!newFileName || newFileName.trim() === '') {
            vscode.window.showErrorMessage(strings.filenameEmpty);
            return;
        }
        const newFilePath = path.join(currentDir, newFileName);
        if (fs.existsSync(newFilePath)) {
            vscode.window.showErrorMessage(strings.filenameExists);
            return;
        }
        try {
            fs.writeFileSync(newFilePath, '');
            vscode.window.showInformationMessage(`文件 "${newFileName}" 创建成功`);
            openFileIfConfigured(newFilePath);
        } catch (error: any) {
            vscode.window.showErrorMessage(`创建文件失败: ${error.message}`);
        }
    });

    context.subscriptions.push(deleteFile, renameFile, copyFileTo, moveFileTo, resetFile, newFileCommand);
}

export function deactivate() {} 
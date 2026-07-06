import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { Menu } from '@base-ui-components/react/menu';
import { SimpleTreeView, TreeItem } from '@mui/x-tree-view';
import FolderIcon from '@mui/icons-material/Folder';
import CloseIcon from '@mui/icons-material/Close';

import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import SaveIcon from '@mui/icons-material/Save';
// import LinkOffIcon from '@mui/icons-material/LinkOff';
import Editor from '@monaco-editor/react';
import { Allotment } from 'allotment';
import { definitionProvider, wceLanguage } from './wce';
import { useAlertContext } from '@/context/alerts';

import './fs.scss';
import styles from './index.module.css';

export const FileExplorer = ({
  setMaxSize,
  onDrop,
  fsHandle,
  onFolderSelected,
  unlink,
}) => {
  const [treeData, setTreeData] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [fileHandle, setFileHandle] = useState(null);
  const [currentFileName, setCurrentFileName] = useState('');
  const { openAlert } = useAlertContext();
  const monacoRef = useRef(null);
  const refreshDirectory = useCallback(async () => {
    setTreeData(null);

    if (!fsHandle) {
      return;
    }

    // Updated loadTree: builds a full relative path for the node ID
    const loadTree = async (dirHandle, parentPath = '') => {
      const nodes = [];
      for await (const [name, handle] of dirHandle.entries()) {
        // Build the full relative path
        const currentPath = parentPath ? `${parentPath}/${name}` : name;
        if (handle.kind === 'directory') {
          const children = await loadTree(handle, currentPath);
          nodes.push({ id: currentPath, name, type: 'directory', children });
        } else {
          if (
            !['.bmp', '.dds', '.ds_store'].some((p) =>
              name.toLowerCase().endsWith(p)
            )
          ) {
            nodes.push({ id: currentPath, name, type: 'file', handle });
          }
        }
      }
      const files = nodes.filter((a) => a.type === 'file');
      const dirs = nodes.filter((a) => a.type === 'directory');
      const sort = (a, b) => (a.name < b.name ? -1 : 1);
      return [...files.sort(sort), ...dirs.sort(sort)];
    };

    await loadTree(fsHandle).then(tree => {
      setTreeData(tree);
    }).catch(() => {
      unlink();
    });
  }, [fsHandle, unlink]);

  useEffect(() => {
    setMaxSize(fileHandle ? 900 : 200);
  }, [fileHandle, setMaxSize]);

  useEffect(() => {
    refreshDirectory();
  }, [refreshDirectory]);

  const handleFileClick = async (node) => {
    if (node.handle) {
      try {
        const file = await node.handle.getFile();
        const text = await file.text();
        setFileContent(text);
        setFileHandle(node.handle);
        setCurrentFileName(node.name);
      } catch (err) {
        console.error('Error reading file:', err);
      }
    }
  };

  const doSave = useCallback(async () => {
    const text = monacoRef.current.editor.getModels()[0].getValue();
    const writable = await fileHandle.createWritable();
    await writable.write(text);
    await writable.close();
    openAlert(`Saved ${fileHandle.name}`);
  }, [fileHandle, openAlert]);

  const renderTree = (nodes, level = 0) =>
    nodes.map((node) => {
      const labelContent = (
        <Box
          sx={{
            display       : 'flex',
            alignItems    : 'center',
            justifyContent: 'space-between',
            width         : '100%',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {node.type === 'directory' ? (
              <FolderIcon fontSize="small" sx={{ mr: 1 }} />
            ) : (
              <InsertDriveFileIcon fontSize="small" sx={{ mr: 1 }} />
            )}
            <Typography variant="body2" sx={{ fontWeight: 'inherit' }}>
              {node.name}
            </Typography>
          </Box>
        </Box>
      );
      return (
        <TreeItem
          key={node.id}
          itemId={node.id}
          onClick={
            node.type === 'file'
              ? (e) => {
                e.stopPropagation();
                handleFileClick(node);
              }
              : undefined
          }
          label={labelContent}
          sx={{ '& > div': { padding: '5px 5px' } }}
        >
          {node.children && node.children.length > 0
            ? renderTree(node.children, level + 1)
            : null}
        </TreeItem>
      );
    });

  return (
    <Box
      onDrop={onDrop}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      className="fs-bg"
      sx={{
        height : '100vh',
        bgcolor: 'background.default',
        color  : 'text.primary',
      }}
    >
      {!fsHandle ? (
        <Box
          className="fs-start"
          sx={{
            width    : '75%',
            margin   : '0 auto',
            padding  : '25px',
            textAlign: 'center',
          }}
        >
          <Typography variant="h5">Welcome to Quail Workspace!</Typography>
          <Typography variant="body1">
            Drop a Quail root WCE folder to get started
          </Typography>
          <Button
            sx={{ margin: '15px auto' }}
            onClick={onFolderSelected}
            variant="outlined"
          >
            Select Folder
          </Button>
        </Box>
      ) : (
        <Allotment
          onDragEnd={() => {
            window.gameController.resize();
          }}
          maxSize={900}
        >
          <Allotment.Pane minSize={50} maxSize={200}>
            <Box
              sx={{
                bgcolor: 'background.paper',
                height : '24px',
                width  : '100%',
              }}
            >
              <Stack
                sx={{ padding: '2px 8px' }}
                direction="row"
                justifyContent={'space-between'}
                alignContent="center"
              >
                <Typography
                  variant="pre"
                  sx={{ fontSize: '13px', lineHeight: '20px' }}
                >
                  {fsHandle?.name}
                </Typography>
                <Menu.Root>
                  <Menu.Trigger className={styles.Button}>
                    <MoreHorizIcon sx={{ width: '20px', height: '20px' }} />
                  </Menu.Trigger>
                  <Menu.Portal>
                    <Menu.Positioner
                      className={styles.Positioner}
                      sideOffset={8}
                    >
                      <Menu.Popup className={styles.Popup}>
                        <Menu.Arrow className={styles.Arrow}></Menu.Arrow>
                        <Menu.Item
                          onClick={refreshDirectory}
                          className={styles.Item}
                        >
                          Reload
                        </Menu.Item>
                        <Menu.Separator className={styles.Separator} />
                        <Menu.Item onClick={unlink} className={styles.Item}>
                          Unlink Directory
                        </Menu.Item>
                      </Menu.Popup>
                    </Menu.Positioner>
                  </Menu.Portal>
                </Menu.Root>
              </Stack>
            </Box>
            <SimpleTreeView
              defaultCollapseIcon={<FolderOpenIcon />}
              defaultExpandIcon={<FolderIcon />}
              sx={{
                minHeight    : 'calc(100% - 25px)',
                maxHeight    : 'calc(100vh - 54px)',
                padding      : '5px',
                color        : 'inherit',
                bgcolor      : 'background.paper',
                border       : 1,
                borderColor  : 'divider',
                overflow     : 'scroll',
                paddingBottom: '25px !important',
              }}
            >
              {treeData ? (
                renderTree(treeData)
              ) : (
                <Typography variant="body2">Loading...</Typography>
              )}
            </SimpleTreeView>
          </Allotment.Pane>
          {fileHandle ? (
            <Allotment.Pane maxSize={700}>
              <Stack
                sx={{ bgcolor: 'background.paper' }}
                direction="row"
                justifyContent={'space-between'}
              >
                <Typography
                  variant="subtitle2"
                  sx={{ padding: '0 10px', lineHeight: '26px' }}
                >
                  {currentFileName}
                </Typography>
                <Stack
                  sx={{
                    button: {
                      borderRadius: '0px',
                      width       : '26px',
                      height      : '26px',
                    },
                    svg: {
                      width : '16px',
                      height: '16px',
                    },
                  }}
                  direction="row"
                >
                  <Tooltip placement="bottom" title={'Save'}>
                    <IconButton onClick={doSave}>
                      <SaveIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip placement="bottom" title={'Close'}>
                    <IconButton
                      onClick={() => {
                        setCurrentFileName('');
                        setFileContent('');
                        setFileHandle(null);
                      }}
                    >
                      <CloseIcon />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>

              {currentFileName ? (
                <Editor
                  theme="vs-dark"
                  height="calc(100vh)"
                  width="100%"
                  value={fileContent}
                  language="wce"
                  beforeMount={(monaco) => {
                    monacoRef.current = monaco;
                    // monaco.editor.addKeybindingRule()
                    monaco.languages.register({ id: 'wce' });
                    monaco.languages.setMonarchTokensProvider(
                      'wce',
                      wceLanguage
                    );
                    monaco.languages.registerDefinitionProvider(
                      'wce',
                      definitionProvider(monaco)
                    );
                  }}
                  onChange={(newValue) => setFileContent(newValue)}
                />
              ) : (
                <Box />
              )}
            </Allotment.Pane>
          ) : null}
        </Allotment>
      )}
    </Box>
  );
};

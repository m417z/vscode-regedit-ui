import React, { useState, useCallback } from 'react';
import { useEvent } from 'react-use';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { Tree, IconButton, Modal, Button, Input } from 'rsuite';
import VsCodeApi from '../VsCodeApi';

const NewItemIconButton = styled(IconButton)`
  visibility: ${({ $visible }) => $visible ? 'visible' : 'hidden'};
  opacity: ${({ $visible }) => $visible ? 1 : 0};
  transition: visibility 0s, opacity 0.5s linear;
  position: absolute !important;
  right: 20px;
  bottom: 20px;
  z-index: 1;
`;

function NewKeyIconButton(props) {
  const { t } = useTranslation();

  const [newKeyDialogOpen, setNewKeyDialogOpen] = useState(false);

  const [newKeyName, setNewKeyName] = useState('');

  const isValidKeyName = name => name !== '' && !name.includes('\\');

  const postCreateKey = () => {
    VsCodeApi.postMessage({
      command: 'createKey',
      key: props.currentRegKey + '\\' + newKeyName
    });
  };

  return (
    <>
      <NewItemIconButton
        onClick={() => {
          setNewKeyName('');
          setNewKeyDialogOpen(true);
        }}
        icon={<FontAwesomeIcon icon={faPlus} />}
        color="blue"
        circle
        $visible={props.hovered && !newKeyDialogOpen}
      />

      <Modal
        backdrop={true}
        size='xs'
        open={newKeyDialogOpen}
        onClose={() => setNewKeyDialogOpen(false)}
        // Stop propogating events, what the library should be doing...
        onClick={event => event.stopPropagation()}
        onDoubleClick={event => event.stopPropagation()}
        onMouseDown={event => event.stopPropagation()}
        onMouseUp={event => event.stopPropagation()}
      >
        <Modal.Title>
          {t('keysTreeView.newKeyModal.title')}
        </Modal.Title>
        <Modal.Body>
          <Input
            value={newKeyName}
            onChange={value => setNewKeyName(value)}
            onKeyDown={event => {
              if (event.key === 'Enter' && isValidKeyName(newKeyName)) {
                postCreateKey();
                setNewKeyDialogOpen(false);
              }
            }}
            placeholder={t('keysTreeView.newKeyModal.newKeyName')}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button
            onClick={() => {
              postCreateKey();
              setNewKeyDialogOpen(false);
            }}
            appearance='primary'
            disabled={!isValidKeyName(newKeyName)}
          >
            {t('keysTreeView.newKeyModal.create')}
          </Button>
          <Button
            onClick={() => setNewKeyDialogOpen(false)}
            appearance='subtle'
          >
            {t('keysTreeView.newKeyModal.cancel')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

const TreeStyleWrapper = styled.div`
  .rs-tree-node-label-content {
    // No word wrapping for long names.
    white-space: nowrap;
  }

  .ReactVirtualized__Grid {
    // Allow to scroll horizontally.
    overflow: auto !important;
  }

  .ReactVirtualized__Grid__innerScrollContainer {
    // Allow to scroll horizontally.
    position: unset !important;
  }

  .rs-tree-nodes {
    // Fix resizing.
    height: 100%;
  }

  .rs-tree-node-label-content {
    // Remove padding, move it to child div for mouse events (see below).
    padding: 0 !important;
  }

  .rs-tree-node-label-content > div {
    // Steal padding from the parent for mouse events (see above).
    padding: 6px 12px 6px 8px;
  }
`;

const initialData = () => [
  {
    label: 'Computer',
    value: '',
    children: [
      {
        label: 'HKEY_CLASSES_ROOT',
        value: 'HKEY_CLASSES_ROOT',
        children: []
      },
      {
        label: 'HKEY_CURRENT_USER',
        value: 'HKEY_CURRENT_USER',
        children: []
      },
      {
        label: 'HKEY_LOCAL_MACHINE',
        value: 'HKEY_LOCAL_MACHINE',
        children: []
      },
      {
        label: 'HKEY_USERS',
        value: 'HKEY_USERS',
        children: []
      },
      {
        label: 'HKEY_CURRENT_CONFIG',
        value: 'HKEY_CURRENT_CONFIG',
        children: []
      }
    ]
  }
];

function KeysTreeNode({ nodeLabel, nodeRegKey, nodeIsSelected, ...props }) {
  const { t } = useTranslation();

  const [editingValue, setEditingValue] = useState(null);

  const applyRename = () => {
    const oldName = nodeLabel;
    const newName = editingValue;
    if (newName !== '' && newName !== oldName) {
      VsCodeApi.postMessage({
        command: 'renameKey',
        key: nodeRegKey,
        newSubKey: newName
      });
    }
  };

  const [deleteConfitmationOpen, setDeleteConfitmationOpen] = useState(false);

  return (
    <div
      onClick={() => {
        if (nodeIsSelected && nodeRegKey.includes('\\')) {
          setEditingValue(nodeLabel);
        }
      }}
      onMouseDown={event => {
        if (event.button === 1) {
          // Middle click.
          // Only allow to remove non-root subkeys.
          if (nodeRegKey.includes('\\')) {
            setDeleteConfitmationOpen(true);
            event.preventDefault();
          }
        }
      }}
    >
      {editingValue !== null ?
        <Input
          size='xs'
          autoFocus
          value={editingValue}
          onChange={value => setEditingValue(value)}
          onKeyDown={event => {
            if (event.key === 'Enter') {
              setEditingValue(null);
              applyRename();
            } else if (event.key === 'Escape') {
              setEditingValue(null);
            }
          }}
          placeholder={t('keysTreeView.keyName')}
          onBlur={() => {
            setEditingValue(null);
            applyRename();
          }}
        />
        :
        props.children
      }

      <Modal
        backdrop={true}
        size='xs'
        open={deleteConfitmationOpen}
        onClose={() => setDeleteConfitmationOpen(false)}
        // Stop propogating events, what the library should be doing...
        onClick={event => event.stopPropagation()}
        onDoubleClick={event => event.stopPropagation()}
        onMouseDown={event => event.stopPropagation()}
        onMouseUp={event => event.stopPropagation()}
      >
        <Modal.Title>
          {t('keysTreeView.confirmDeleteKeyModal.title')}
        </Modal.Title>
        <Modal.Body>
          {t('keysTreeView.confirmDeleteKeyModal.text', { key: nodeLabel })}
        </Modal.Body>
        <Modal.Footer>
          <Button
            onClick={() => {
              VsCodeApi.postMessage({
                command: 'deleteKey',
                key: nodeRegKey
              });
              setDeleteConfitmationOpen(false);
            }}
            appearance='primary'
          >
            {t('global.yes')}
          </Button>
          <Button
            onClick={() => setDeleteConfitmationOpen(false)}
            appearance='subtle'
          >
            {t('global.no')}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

function KeysTreeView() {
  const { t } = useTranslation();

  const [treeKey, setTreeKey] = useState(0);

  const [data, setData] = useState(initialData());

  const [treeValue, setTreeValue] = useState('');

  const onSetKeyTreeAndValues = useCallback(message => {
    const mapData = (data, prefix = '') => data.map(item => ({
      label: item.name,
      value: prefix + item.name,
      children: item.children && mapData(item.children, prefix + item.name + '\\')
    }));

    let newData = initialData();
    if (message.tree.length > 0) {
      const mappedData = mapData(message.tree);
      const rootKey = mappedData[0].value;
      const rootChildren = mappedData[0].children;

      newData[0].children.find(x => x.value === rootKey).children = rootChildren;
    }

    setData(newData);
    setTreeValue(message.retrievedKey);
    setTreeKey(treeKey + 1); // a hack to remount the element
  }, [treeKey]);

  const onSetSubKeys = useCallback(message => {
    const targetKey = message.key;
    const subData = message.subKeys.length === 0 ? undefined : message.subKeys.map(item => ({
      label: item,
      value: targetKey + '\\' + item,
      children: []
    }));

    const copyRecursiveWithSubKeys = dataToCopy => {
      let newData = [];
      for (const item of dataToCopy) {
        if (item.value === targetKey) {
          newData.push(Object.assign({}, item, {
            children: subData
          }));
          continue;
        }

        if (item.value === '' || targetKey.startsWith(item.value + '\\')) {
          newData.push(Object.assign({}, item, {
            children: item.children && copyRecursiveWithSubKeys(item.children)
          }));
          continue;
        }

        newData.push(item);
      }

      return newData;
    };

    const newData = copyRecursiveWithSubKeys(data);
    setData(newData);
  }, [data]);

  const onCreateKeyDone = useCallback(message => {
    const createdKey = message.key;

    const copyRecursiveWithAdded = (dataToCopy, iterKey = '') => {
      let newData = [];
      let foundNext = false;
      for (const item of dataToCopy || []) {
        if (item.value === createdKey) {
          foundNext = true;
        } else if (item.value === '' || createdKey.startsWith(item.value + '\\')) {
          foundNext = true;
          newData.push(Object.assign({}, item, {
            children: copyRecursiveWithAdded(item.children, item.value)
          }));
          continue;
        }

        newData.push(item);
      }

      if (!foundNext && iterKey !== '' && (dataToCopy === undefined || dataToCopy.length > 0)) {
        const newValue = createdKey.slice((iterKey + '\\').length).replace(/\\.*$/, '');
        newData.push({
          label: newValue,
          value: iterKey + '\\' + newValue,
          children: undefined
        });
      }

      return newData;
    };

    const newData = copyRecursiveWithAdded(data);
    setData(newData);
  }, [data]);

  const onRenameKeyDone = useCallback(message => {
    const oldKey = message.key;
    const newSubKey = message.newSubKey;
    const newKey = oldKey.replace(/\\[^\\]+$/, '\\' + newSubKey);

    if (treeValue === oldKey || treeValue.startsWith(oldKey + '\\')) {
      setTreeValue(newKey);
      VsCodeApi.postMessage({
        command: 'getKeyValues',
        key: newKey
      });
    }

    const copyRecursiveWithRename = dataToCopy => {
      let newData = [];
      for (const item of dataToCopy) {
        if (item.value === oldKey || item.value.startsWith(oldKey + '\\')) {
          newData.push(Object.assign({}, item, {
            label: item.value === oldKey ? newSubKey : item.label,
            value: newKey + item.value.slice(oldKey.length),
            children: item.children && copyRecursiveWithRename(item.children)
          }));
          continue;
        }

        if (item.value === '' || oldKey.startsWith(item.value + '\\')) {
          newData.push(Object.assign({}, item, {
            children: item.children && copyRecursiveWithRename(item.children)
          }));
          continue;
        }

        newData.push(item);
      }

      return newData;
    };

    const newData = copyRecursiveWithRename(data);
    setData(newData);
  }, [data, treeValue]);

  const onDeleteKeyDone = useCallback(message => {
    const deletedKey = message.key;

    if (treeValue === deletedKey || treeValue.startsWith(deletedKey + '\\')) {
      const newKey = deletedKey.replace(/\\[^\\]+$/, '');
      setTreeValue(newKey);
      VsCodeApi.postMessage({
        command: 'getKeyValues',
        key: newKey
      });
    }

    const copyRecursiveWithoutDeleted = dataToCopy => {
      let newData = [];
      for (const item of dataToCopy) {
        if (item.value === deletedKey) {
          continue;
        }

        if (item.value === '' || deletedKey.startsWith(item.value + '\\')) {
          newData.push(Object.assign({}, item, {
            children: item.children && copyRecursiveWithoutDeleted(item.children)
          }));
          continue;
        }

        newData.push(item);
      }

      return newData.length > 0 ? newData : undefined;
    };

    const newData = copyRecursiveWithoutDeleted(data);
    setData(newData);
  }, [data, treeValue]);

  const onMessage = useCallback(event => {
    const message = event.data;
    switch (message.command) {
      case 'setKeyTreeAndValues':
        onSetKeyTreeAndValues(message);
        break;

      case 'setSubKeys':
        onSetSubKeys(message);
        break;

      case 'createKeyDone':
        onCreateKeyDone(message);
        break;

      case 'renameKeyDone':
        onRenameKeyDone(message);
        break;

      case 'deleteKeyDone':
        onDeleteKeyDone(message);
        break;

      default:
        break;
    }
  }, [onSetKeyTreeAndValues, onSetSubKeys, onCreateKeyDone, onRenameKeyDone, onDeleteKeyDone]);

  useEvent('message', onMessage);

  const [hovered, setHovered] = useState(false);

  return (
    <AutoSizer>
      {({ height, width }) => (
        <TreeStyleWrapper
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <NewKeyIconButton currentRegKey={treeValue} hovered={hovered} />
          {[treeKey].map(key =>
            <Tree
              key={key}
              virtualized
              defaultExpandAll
              data={data}
              value={treeValue}
              height={height}
              style={{ maxHeight: height, width: width }}
              renderTreeNode={nodeData => (
                <KeysTreeNode
                  nodeLabel={nodeData.label}
                  nodeRegKey={nodeData.value}
                  nodeIsSelected={nodeData.value !== '' && nodeData.value === treeValue}
                >
                  {nodeData.value === '' ? t('keysTreeView.computer') : nodeData.label}
                </KeysTreeNode>
              )}
              onExpand={(expandItemValues, activeNode) => {
                if (activeNode.children && activeNode.children.length === 0) {
                  VsCodeApi.postMessage({
                    command: 'getSubKeys',
                    key: activeNode.value
                  });
                }
              }}
              onSelect={(activeNode, value) => {
                if (value !== '' && value !== treeValue) {
                  setTreeValue(value);
                  VsCodeApi.postMessage({
                    command: 'getKeyValues',
                    key: value
                  });
                }
                if (activeNode.children && activeNode.children.length === 0) {
                  VsCodeApi.postMessage({
                    command: 'getSubKeys',
                    key: activeNode.value
                  });
                }
              }}
            />
          )}
        </TreeStyleWrapper>
      )}
    </AutoSizer>
  );
};

export default KeysTreeView;

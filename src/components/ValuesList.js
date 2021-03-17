import React, { useState, useCallback } from 'react';
import { useEvent } from 'react-use';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalculator, faFileAlt, faDatabase, faPlus } from '@fortawesome/free-solid-svg-icons'
import { Table, IconButton, Input, Modal, Button, SelectPicker } from 'rsuite';
import VsCodeApi from '../VsCodeApi';

const NewItemIconButton = styled(IconButton)`
  visibility: ${({ $visible }) => $visible ? 'visible' : 'hidden'};
  opacity: ${({ $visible }) => $visible ? 1 : 0};
  transition: visibility 0s, opacity 0.5s linear;
  position: absolute !important;
  left: 20px;
  bottom: 20px;
  z-index: 1;
`;

function NewValueIconButton(props) {
  const { t } = useTranslation();

  const [newValueDialogOpen, setNewValueDialogOpen] = useState(false);

  const [newValueName, setNewValueName] = useState('');
  const [newValueType, setNewValueType] = useState('');
  const [newValueData, setNewValueData] = useState('');

  const isValidValueData = () => newValueType !== '';

  const postCreateValue = () => {
    VsCodeApi.postMessage({
      command: 'createValue',
      key: props.currentRegKey,
      name: newValueName,
      type: newValueType,
      data: newValueData
    });
  };

  const onInputKeyDown = event => {
    if (event.key === 'Enter' && isValidValueData()) {
      postCreateValue();
      setNewValueDialogOpen(false);
    }
  };

  return (
    <>
      <NewItemIconButton
        onClick={() => {
          setNewValueName('');
          setNewValueType('');
          setNewValueData('');
          setNewValueDialogOpen(true);
        }}
        icon={<FontAwesomeIcon icon={faPlus} />}
        color="blue"
        circle
        $visible={props.hovered && !newValueDialogOpen}
      />

      <Modal
        backdrop={true}
        size='xs'
        open={newValueDialogOpen}
        onClose={() => setNewValueDialogOpen(false)}
        // Stop propogating events, what the library should be doing...
        onClick={event => event.stopPropagation()}
        onDoubleClick={event => event.stopPropagation()}
        onMouseDown={event => event.stopPropagation()}
        onMouseUp={event => event.stopPropagation()}
      >
        <Modal.Title>
          {t('valuesList.newValueModal.title')}
        </Modal.Title>
        <Modal.Body>
          <Input
            value={newValueName}
            onChange={value => setNewValueName(value)}
            onKeyDown={onInputKeyDown}
            placeholder={t('valuesList.newValueModal.newValueName')}
          />
          <SelectPicker
            value={newValueType}
            onChange={value => setNewValueType(value)}
            data={[
              {
                label: t('valuesList.newValueModal.types.dword') + ' (REG_DWORD)',
                value: 'REG_DWORD'
              },
              {
                label: t('valuesList.newValueModal.types.string') + ' (REG_SZ)',
                value: 'REG_SZ'
              },
              {
                label: t('valuesList.newValueModal.types.expandableString') + ' (REG_EXPAND_SZ)',
                value: 'REG_EXPAND_SZ'
              },
              {
                label: t('valuesList.newValueModal.types.multiString') + ' (REG_MULTI_SZ)',
                value: 'REG_MULTI_SZ'
              },
              {
                label: t('valuesList.newValueModal.types.binaryData') + ' (REG_BINARY)',
                value: 'REG_BINARY'
              },
              {
                label: 'REG_NONE',
                value: 'REG_NONE'
              },
              {
                label: 'REG_DWORD_BIG_ENDIAN',
                value: 'REG_DWORD_BIG_ENDIAN'
              },
              {
                label: 'REG_LINK',
                value: 'REG_LINK'
              },
              {
                label: 'REG_RESOURCE_LIST',
                value: 'REG_RESOURCE_LIST'
              },
              {
                label: 'REG_FULL_RESOURCE_DESCRIPTOR',
                value: 'REG_FULL_RESOURCE_DESCRIPTOR'
              },
              {
                label: 'REG_RESOURCE_REQUIREMENTS_LIST',
                value: 'REG_RESOURCE_REQUIREMENTS_LIST'
              },
              {
                label: 'REG_QWORD',
                value: 'REG_QWORD'
              }
            ]}
            defaultValue=''
            searchable={false}
            cleanable={false}
            style={{ width: '100%', marginTop: '5px' }}
            placeholder={t('valuesList.newValueModal.selectValueType')}
          />
          <Input
            value={newValueData}
            onChange={value => setNewValueData(value)}
            onKeyDown={onInputKeyDown}
            placeholder={t('valuesList.newValueModal.insertValueData')}
            style={{ marginTop: '5px' }}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button
            onClick={() => {
              postCreateValue();
              setNewValueDialogOpen(false);
            }}
            appearance='primary'
            disabled={!isValidValueData(newValueName)}
          >
            {t('valuesList.newValueModal.create')}
          </Button>
          <Button
            onClick={() => setNewValueDialogOpen(false)}
            appearance='subtle'
          >
            {t('valuesList.newValueModal.cancel')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

const CustomTableCell = styled(Table.Cell)`
  .rs-table-cell-content {
    display: flex;
    align-items: center;
  }
`;

const CustomTableCellText = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
`;

function ValueNameCell({ rowData, dataKey, currentKey, ...props }) {
  const { t } = useTranslation();

  let icon = faDatabase;
  let color = 'var(--vscode-charts-orange)';
  switch (rowData['type']) {
    case 'REG_DWORD':
      icon = faCalculator;
      color = 'var(--vscode-charts-green)';
      break;

    case 'REG_SZ':
    case 'REG_EXPAND_SZ':
    case 'REG_MULTI_SZ':
      icon = faFileAlt;
      color = 'var(--vscode-charts-purple)';
      break;

    default:
      break;
  }

  const [editingValue, setEditingValue] = useState(null);

  const applyRename = () => {
    const oldName = rowData.name;
    const newName = editingValue;
    if (newName !== oldName) {
      VsCodeApi.postMessage({
        command: 'renameValue',
        key: currentKey,
        oldName,
        newName
      });
    }
  };

  const [deleteConfitmationOpen, setDeleteConfitmationOpen] = useState(false);

  const valueName = rowData[dataKey] || t('valuesList.defaultName');

  return (
    <CustomTableCell {...props}
      onClick={() => setEditingValue(rowData[dataKey])}
      onMouseDown={event => {
        if (event.button === 1) {
          // Middle click.
          setDeleteConfitmationOpen(true);
        }
      }}
    >
      <FontAwesomeIcon icon={icon} style={{ color, marginRight: '8px' }} />
      {editingValue !== null ?
        <Input
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
          placeholder='Name'
          onBlur={() => {
            setEditingValue(null);
            applyRename();
          }}
        />
        :
        <CustomTableCellText>
          {valueName}
        </CustomTableCellText>
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
          {t('valuesList.confirmDeleteValueModal.title')}
        </Modal.Title>
        <Modal.Body>
          {t('valuesList.confirmDeleteValueModal.text', { value: valueName })}
        </Modal.Body>
        <Modal.Footer>
          <Button
            onClick={() => {
              VsCodeApi.postMessage({
                command: 'deleteValue',
                key: currentKey,
                name: rowData.name
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
    </CustomTableCell>
  );
}

function ValueDataCell({ rowData, dataKey, currentKey, ...props }) {
  const [editingData, setEditingData] = useState(null);

  const applySetData = () => {
    const oldData = rowData.value;
    const newData = typeof oldData === 'number' ? parseInt(editingData) : editingData;
    if (oldData !== newData) {
      VsCodeApi.postMessage({
        command: 'setValueData',
        key: currentKey,
        type: rowData.type,
        name: rowData.name,
        data: newData
      });
    }
  };

  return (
    <CustomTableCell {...props} onClick={() => setEditingData(rowData[dataKey])}>
      {editingData !== null ?
        <Input
          autoFocus
          value={editingData}
          onChange={value => setEditingData(value)}
          onKeyDown={event => {
            if (event.key === 'Enter') {
              setEditingData(null);
              applySetData();
            } else if (event.key === 'Escape') {
              setEditingData(null);
            }
          }}
          placeholder='Value'
          onBlur={() => {
            setEditingData(null);
            applySetData();
          }}
        />
        :
        <CustomTableCellText>
          {typeof rowData[dataKey] === 'number' ?
            '0x' + rowData[dataKey].toString(16).padStart(8, '0') + ' (' + rowData[dataKey].toString() + ')'
            :
            rowData[dataKey]
          }
        </CustomTableCellText>
      }
    </CustomTableCell>
  );
}

function ValuesList() {
  const { t } = useTranslation();

  const [data, setData] = useState([]);

  const [currentKey, setCurrentKey] = useState('');

  const onMessage = useCallback(event => {
    const message = event.data;
    switch (message.command) {
      case 'setKeyValues':
        setData(message.values);
        setCurrentKey(message.key);
        break;

      case 'setKeyTreeAndValues':
        setData(message.values);
        setCurrentKey(message.retrievedKey);
        break;

      case 'renameValueDone':
        if (message.key !== currentKey) {
          throw new Error(`Expected data for ${currentKey}, got data for ${message.key}`);
        }

        setData(data.map(x => {
          if (x.name === message.oldName) {
            return Object.assign({}, x, { name: message.newName });
          }

          return x;
        }));
        break;

      case 'createValueDone':
        if (message.key !== currentKey) {
          throw new Error(`Expected data for ${currentKey}, got data for ${message.key}`);
        }

        setData(data.concat([{
          name: message.name,
          type: message.type,
          value: message.data
        }]));
        break;

      case 'setValueDataDone':
        if (message.key !== currentKey) {
          throw new Error(`Expected data for ${currentKey}, got data for ${message.key}`);
        }

        setData(data.map(x => {
          if (x.name === message.name) {
            return Object.assign({}, x, { value: message.newData });
          }

          return x;
        }));
        break;

      case 'deleteValueDone':
        if (message.key !== currentKey) {
          throw new Error(`Expected data for ${currentKey}, got data for ${message.key}`);
        }

        setData(data.filter(x => x.name !== message.name));
        break;

      default:
        break;
    }
  }, [currentKey, data]);

  useEvent('message', onMessage);

  const [hovered, setHovered] = useState(false);

  return (
    <AutoSizer>
      {({ height, width }) => (
        <div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <NewValueIconButton currentRegKey={currentKey} hovered={hovered} />
          <Table
            virtualized
            data={data}
            height={height}
            style={{ width: width }}
          >
            <Table.Column width={200} resizable>
              <Table.HeaderCell>{t('valuesList.columnNames.name')}</Table.HeaderCell>
              <ValueNameCell dataKey="name" currentKey={currentKey} />
            </Table.Column>

            <Table.Column width={150} resizable>
              <Table.HeaderCell>{t('valuesList.columnNames.type')}</Table.HeaderCell>
              <Table.Cell dataKey="type" />
            </Table.Column>

            <Table.Column width={300} resizable>
              <Table.HeaderCell>{t('valuesList.columnNames.value')}</Table.HeaderCell>
              <ValueDataCell dataKey="value" currentKey={currentKey} />
            </Table.Column>
          </Table>
        </div>
      )}
    </AutoSizer>
  );
}

export default ValuesList;

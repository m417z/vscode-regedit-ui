import styled from 'styled-components';
import { useState, useCallback, useEffect } from 'react';
import { useEvent } from 'react-use';
import { useTranslation } from 'react-i18next';
import Split from 'react-split';
import AddressBar from './AddressBar';
import KeysTreeView from './KeysTreeView';
import ValuesList from './ValuesList';
import VsCodeApi from '../VsCodeApi';

const RegeditWrapper = styled.div`
  display: ${({ $hidden }) => $hidden ? 'none' : 'flex'};
  flex-direction: column;
  height: 100vh;
  width: 100%;
`;

const RegeditSplit = styled(Split)`
  display: flex;
  height: 100%;
  .gutter {
    cursor: ew-resize;
    padding: 0 5px;
    box-sizing: border-box;
    background-color: var(--vscode-panelSection-border);
    background-clip: content-box;
  }
`;

const RegeditSplitPanel = styled.div`
  overflow: hidden;
`;

function Regedit() {
  const { ready } = useTranslation();

  const [initialDataPending, setInitialDataPending] = useState(true);

  useEffect(() => {
    let pending = false;
    if (VsCodeApi) {
      const savedState = VsCodeApi.getState();
      if (savedState && savedState.address) {
        VsCodeApi.postMessage({
          command: 'getKeyTreeAndValues',
          key: savedState.address
        });
        pending = true;
      }
    }

    setInitialDataPending(pending);
  }, []);

  const onMessage = useCallback(event => {
    const message = event.data;
    switch (message.command) {
      case 'setKeyTreeAndValues':
        setInitialDataPending(false);
        break;

      default:
        break;
    }
  }, []);

  useEvent('message', onMessage);

  return (
    <RegeditWrapper $hidden={initialDataPending || !ready}>
      <AddressBar />
      <RegeditSplit
        sizes={[25, 75]}
        cursor=''
        gutterSize={11}
        snapOffset={0}
      >
        <RegeditSplitPanel>
          <KeysTreeView />
        </RegeditSplitPanel>
        <RegeditSplitPanel>
          <ValuesList />
        </RegeditSplitPanel>
      </RegeditSplit>
    </RegeditWrapper>
  );
}

export default Regedit;

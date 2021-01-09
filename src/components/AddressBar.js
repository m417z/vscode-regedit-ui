import styled from 'styled-components';
import { useState, useCallback } from 'react';
import { useEvent } from 'react-use';
import { useTranslation } from 'react-i18next';
import { Input } from 'rsuite';
import VsCodeApi from '../VsCodeApi';

const StyledInput = styled(Input)`
  margin-top: 5px;
`;

function AddressBar() {
  const { t } = useTranslation();

  const [address, setAddress] = useState('');

  const onMessage = useCallback(event => {
    const setNewAddress = newAddress => {
      VsCodeApi.setState({ address: newAddress });
      VsCodeApi.postMessage({
        command: 'setTitle',
        title: newAddress.replace(/^.*\\/, '')
      });
      setAddress(newAddress);
    };

    const message = event.data;
    switch (message.command) {
      case 'setKeyValues':
        setNewAddress(message.key);
        break;

      case 'setKeyTreeAndValues':
        setNewAddress(message.retrievedKey);
        break;

      default:
        break;
    }
  }, []);

  const normalizeAddress = useCallback(userAddress => {
    let normalized = userAddress.trim();
    normalized = normalized.replace(/^Computer\\/i, '');
    normalized = normalized.replace(/^HKCR(\\|$)/i, 'HKEY_CLASSES_ROOT$1');
    normalized = normalized.replace(/^HKCU(\\|$)/i, 'HKEY_CURRENT_USER$1');
    normalized = normalized.replace(/^HKLM(\\|$)/i, 'HKEY_LOCAL_MACHINE$1');
    normalized = normalized.replace(/^HKU(\\|$)/i, 'HKEY_USERS$1');
    normalized = normalized.replace(/^HKCC(\\|$)/i, 'HKEY_CURRENT_CONFIG$1');
    if (!normalized.match(/^(HKEY_CLASSES_ROOT|HKEY_CURRENT_USER|HKEY_LOCAL_MACHINE|HKEY_USERS|HKEY_CURRENT_CONFIG)(\\|$)/i)) {
      return null;
    }

    normalized = normalized.replace(/\\+$/, '');
    normalized = normalized.replace(/\\{2,}/g, '\\');

    return normalized;
  }, []);

  useEvent('message', onMessage);

  return (
    <StyledInput
      value={address}
      onChange={value => setAddress(value)}
      onKeyDown={event => {
        if (event.key === 'Enter') {
          const normalizedAddress = normalizeAddress(address);
          if (normalizedAddress) {
            VsCodeApi.postMessage({
              command: 'getKeyTreeAndValues',
              key: normalizedAddress
            });
          } else {
            VsCodeApi.postMessage({
              command: 'alert',
              text: t('addressBar.invalidRegistryPath')
            });
          }
        }
      }}
      placeholder={t('addressBar.registryPath')}
    />
  );
}

export default AddressBar;

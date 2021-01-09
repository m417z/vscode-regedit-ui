/* global acquireVsCodeApi */

const VsCodeApi = typeof acquireVsCodeApi !== 'undefined' ? acquireVsCodeApi() : null;

export default VsCodeApi;

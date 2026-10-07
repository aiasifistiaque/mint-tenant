import PageTable from './PageTable';
import BackendPageTable from './BackendPageTable';
import ServerPageTable from './ServerPageTable';
import withPublishedConfig from './withPublishedConfig';

// The hand-written table pages defer to a table config published in the
// route builder, when there is one — see withPublishedConfig.
const ConfiguredPageTable = withPublishedConfig(PageTable);
const ConfiguredBackendPageTable = withPublishedConfig(BackendPageTable);
const ConfiguredServerPageTable = withPublishedConfig(ServerPageTable);

export {
	ConfiguredPageTable as PageTable,
	ConfiguredBackendPageTable as BackendPageTable,
	ConfiguredServerPageTable as ServerPageTable,
};
export { default as ServerPage } from './ServerPage';
export { default as ImagePage } from './ImagePage';

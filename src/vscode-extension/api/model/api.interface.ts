/* eslint-disable @typescript-eslint/no-explicit-any */
export interface PopupMessage {
  message: string;
  advise?: string;
  lastDetected_date: string;
  status: string;
  link?: string;
}

export interface Level0Entry {
  level: number;
  label: string;
  lineNumber?: number;
  line?: { no: number; from: number; to: number };
  popupMessage: PopupMessage;
  severity: string;
  language: string;
  scanId: string;
  name: string;
  id: string;
  organizationId: string;
  projectId: string;
  ruleId: string;
  filePath: string;
}

export interface Level1Entry {
  level: number;
  label: string;
  issuesCount: number;
  filePath: string;
  fileType: string;
  child: Level0Entry[];
}

export interface ProjectSource {
  level: number;
  label: string;
  issuesCount: number;
  filesCount: number;
  child: Level1Entry[];
}

export interface Message {
  text: string;
}

export interface ArtifactLocation {
  [key: string]: any;
}

export interface Region {
  startLine: number;
  snippet: {
    text: string;
    rendered: {
      text: string;
    };
  };
  properties: {
    ir: string[];
  };
}

export interface PhysicalLocation {
  artifactLocation: ArtifactLocation;
  region: Region;
}

export interface LogicalLocation {
  name: string;
  fullyQualifiedName: string;
}

export interface Location {
  physicalLocation: PhysicalLocation;
  logicalLocations?: LogicalLocation[];
  message: Message;
}

export interface State {
  [key: string]: {
    text: string;
    properties: {
      taintTags: string[];
    };
  };
}

export interface ThreadFlowLocation {
  importance: string;
  location: Location;
  state?: State;
}

export interface ThreadFlow {
  locations: ThreadFlowLocation[];
}

export interface CodeFlow {
  message: Message;
  threadFlows: ThreadFlow[];
  properties: {
    routeSignature: string;
  };
}

export interface Audit {
  id: string;
  scanId: string;
  organizationId: string;
  projectId: string;
  resultId: string;
  userRole: string;
  userId: string;
  userEmail: string;
  dateModified: string;
  previousResultStatus?: string;
  newResultStatus?: string;
  previousRuleSeverity?: string | null;
  newRuleSeverity?: string | null;
  comment?: string | null;
}

export interface Vulnerability {
  name: string;
  id: string;
  scanId: string;
  organizationId: string;
  projectId: string;
  ruleId: string;
  message: Message;
  level: string;
  language: string | null;
  severity: string;
  codeFlows: CodeFlow[];
  locations?: Location[];
  securityStandards?: any;
  status: string;
  firstCreatedTime: string;
  lastSeenTime: string;
  isNew: boolean;
  audit: Audit[];
}

export type SourceJson = {
  [key: string]: any;
};

export interface Params {
  page: number;
  size: number;
  status?: string;
  severity?: string;
  archived?: boolean;
}

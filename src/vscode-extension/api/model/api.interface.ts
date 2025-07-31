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
  labelFilePath?: string;
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
  expand?: string;
}

export interface Value {
  value: string;
  count: number;
}

export interface ResponseCustomSession {
  id: string;
  label: string;
  values: Value[];
}

export interface ListOfTagsResponse {
  id: number;
  label: string;
}

export interface ListOfTags {
  tags: ListOfTagsResponse[];
}

export interface PopupMessageVulnerability {
  lastDetected_date: string;
  firstDetected_date: string;
  status: string;
  link?: string;
}

export interface OverviewChapters {
  type: string;
  introText: string;
  body: string;
}

export interface OverviewRisk {
  text?: string;
  formattedText?: string;
}

export interface OverviewDetails {
  chapters: OverviewChapters[];
  risk: OverviewRisk;
}

export interface Recommendation {
  formattedText?: string;
}

export interface CustomRecommendation {
  text: string;
}

export interface Rulereferences {
  text: string;
}

export interface CustomRuleReferences {
  text: string;
}

export interface HowToFixText {
  recommendation: Recommendation;
  custom_recommendation: CustomRecommendation;
  owasp: string;
  cwe: string;
  rule_references: Rulereferences;
  custom_rule_references: CustomRuleReferences;
}

export interface ChildData {
  label: string;
}

export interface Datas {
  label: string;
  isRoot: boolean;
  child: ChildData[];
}

export interface Events {
  data: Datas[];
}

export interface HttpRequest {
  text: string;
}

export interface Tags {
  id: number;
  label: string;
}

export interface Level0Vulnerability {
  level: number;
  traceId: string;
  label: string;
  labelForMapping: string;
  language: string;
  lineNumber: number;
  popupMessage: PopupMessageVulnerability;
  Substatus_keycode: string;
  severity: string;
  fileName: string;
  filePath: string;
  fileFullPath: string;
  overview?: OverviewDetails;
  howToFix: HowToFixText;
  events: Events;
  http_request?: HttpRequest;
  tags: Tags[];
  isUnmapped?: boolean;
}

export interface EventLine {
  text: string;
}

export interface EventCodeView {
  lines: EventLine[];
}

export interface EventDataView {
  lines: EventLine[];
}

export interface EventItem {
  type: string;
  description: string;
  codeView: EventCodeView;
  dataView: EventDataView;
}

export interface EventCategory {
  label: string;
  isRoot: boolean;
  data: Event[];
}

export interface Level1Vulnerability {
  level: number;
  label: string;
  issuesCount: number;
  filePath: string;
  fileType: string;
  child: Level0Vulnerability[];
  isUnmapped?: boolean;
}

export interface Level2Vulnerability {
  level: number;
  label: string;
  issuesCount: number;
  filesCount: number;
  child: Level1Vulnerability[];
  isUnmapped?: boolean;
}

export interface SourceJsonVulnerability {
  app_version_tags: any[];
  bugtracker_tickets: any[];
  category: string;
  category_label: string;
  closed_time: any;
  confidence: string;
  confidence_label: string;
  default_severity: string;
  default_severity_label: string;
  discovered: number;
  evidence: any;
  first_time_seen: number;
  hasParentApp: boolean;
  impact: string;
  impact_label: string;
  instance_uuid: string;
  language: string;
  last_time_seen: number;
  last_vuln_time_seen: number;
  license: string;
  likelihood: string;
  likelihood_label: string;
  organization_name: string;
  reported_to_bug_tracker: boolean;
  reported_to_bug_tracker_time: any;
  rule_name: string;
  rule_title: string;
  severity: string;
  severity_label: string;
  status: string;
  sub_status: string;
  sub_title: string;
  substatus_keycode: any;
  tags: any[];
  title: string;
  total_traces_received: number;
  uuid: string;
  violations: any[];
  visible: boolean;
}

export interface VulnerabilitiesWithFilterResponse {
  success: boolean;
  messages: string[];
  traces: SourceJsonVulnerability[];
}

export interface VulnerabilityByAppIdResponse {
  success: boolean;
  messages: string[];
  story: Story;
}

export interface ChapterBodyFormatVariables {
  lineNumber?: number;
  fileName: string;
  fileType: string;
  filePath: string;
  className: string;
  html2377811419: string;
}

export interface Chapters {
  bodyFormatVariables?: ChapterBodyFormatVariables;
  introText: string;
  type: string;
  body: string;
}

export interface Story {
  chapters: Chapters[];
  risk: OverviewRisk;
}

export interface GetAssessVulenarabilityRequest {
  orgId: string;
  appId: string;
  servers?: string | string[];
  appVersionTags?: string | string[];
  severities?: string;
  status?: string;
  startDate?: number;
  endDate?: number;
  agentSessionId?: string;
  metadataFilters?: {
    fieldID: string;
    values: string[];
  };
}

export interface AssessRequest {
  orgId: string;
  appId: string;
  servers?: number | number[] | string | string[];
  appVersionTags?: string | string[];
  severities?: string;
  status?: string;
  startDate?: number;
  endDate?: number;
  agentSessionId?: string;
  metadataFilters?: [
    {
      fieldID: string;
      values: string[];
    },
  ];
}

export interface addMarkByOrgIdParams {
  orgId: string;
  traceId: string[];
  status: string;
  note: string;
  substatus?: string;
}

export interface addMarkByOrgIdReqParams {
  traces: string[];
  status: string;
  note: string;
  substatus?: string;
}

export interface updateTagsByTraceIdParams {
  traceId: string;
  tags: string[];
}

export interface updateParams {
  traceId: string[];
  status: string;
  note: string;
  substatus?: string;
}
export interface FinalFilter {
  servers?: number[] | string[];
  appVersionTags?: number[] | string[];
  severities?: number[] | string[];
  status?: number[] | string[];
  startDate?: number;
  endDate?: number;
  agentSessionId?: string;
  metadataFilters?: Array<{ fieldID?: string; values?: Array<string> }>;
  activeSessionMetadata?: string;
  applicationTags?: string | string[];
  environments?: string | string[];
}
export interface newData {
  [x: string]: any;
  id: string;
  name: string;
  archieve: boolean;
}

export interface LibraryVulnerability {
  hash: string;
  custom: boolean;
  grade: string;
  score: number;
  agePenalty: number;
  versionPenalty: number;
  version: string;
  loc: number;
  vulns: any[];
  tags: string[];
  restricted: boolean;
  licenses: string[];
  ossEnabled: boolean;
  licenseViolation: boolean;
  apps: any[];
  remediationGuidance: {
    minUpgrade: {
      version: string;
      grade: string;
      score: number;
      versionsBehind: number;
      releaseDate: number;
    };
    maxUpgrade: {
      version: string;
      grade: string;
      score: number;
      versionsBehind: number;
      releaseDate: number;
    };
  };
  file_name: string;
  app_language: string;
  group: string;
  file_version: string;
  latest_version: string;
  release_date: number;
  latest_release_date: number;
  classes_used: number;
  class_count: number;
  loc_shorthand: string;
  total_vulnerabilities: number;
  months_outdated: number;
  versions_behind: number;
  critical_vulnerabilities: number;
  high_vulnerabilities: number;
  invalid_version: boolean;
  bugtracker_tickets: string[];
  library_class_usage_counts: any[];
}

// CVE-level information (Leaf node)
interface CVEVector {
  label: string;
  value: string;
}

interface CVESeverityAndMetric {
  name: string;
  severity: string;
  score: number;
}

export interface CVEOverview {
  cisa?: boolean;
  severity: string;
  score?: string;
  firstSeen: string;
  nvdPublished: string;
  nvdModified: string;
  cveRecordLink: string;
  nvdRecordLink: string;
  severityAndMetrics: CVESeverityAndMetric[];
  vector: {
    label?: string;
    vectors?: CVEVector[];
  };
  description: string;
  organizationalImpact?: [
    {
      name: 'Applications';
      impactedAppCount: number;
      totalAppCount: number;
      appPercentage: number;
    },
    {
      name: 'Servers';
      impactedServerCount: number;
      totalServerCount: number;
      serverPercentage: number;
    },
  ];
  applications?: string[];
  servers?: string[];
  epss_percentile: number;
  epss_score: number;
  cvss_3_severity_value: number;
}

export interface CVENode {
  level: number;
  label: string;
  overview: CVEOverview;
  redirectionUrl: string;
}

// Usage observation data
export interface LibraryUsageObservation {
  name: string;
  firstObservedTime: string;
  lastObservedTime: string;
}

// Library-level information (Mid node)
interface LibraryOverview {
  file_name: string;
  version: string;
  release_date?: string | undefined | 0;
  hash: string;
  licenses: string[];
  grade: string;
  score: number;
  total_vulnerabilities: number;
  policy_violations: number;
  apps_using: number;
  classes_used: number;
  class_count: number;
  app_language: string;
}

interface LibraryFixVersion {
  version: string;
  grade: string;
  score: number;
  releaseDate?: string | undefined | 0;
  versionsBehind?: number;
}

interface LibraryHowToFix {
  minUpgrade: LibraryFixVersion;
  maxUpgrade: LibraryFixVersion;
}

export interface LibraryUsage {
  total: number;
  classes_used: number;
  class_count: number;
  observations?: LibraryUsageObservation[];
  id?: string;
}

export interface LibraryNode {
  level: number;
  label: string;
  parentMatch: string;
  cveCount: number;
  restrictedLicenses: boolean;
  restrictedLibraries: boolean;
  outdatedLibrary: boolean;
  overview: LibraryOverview;
  howToFix: LibraryHowToFix;
  usage: LibraryUsage;
  path: { path: string; link: string }[];
  tags: string[];
  redirectionUrl: string;
  child: CVENode[];
  isUnmapped: boolean;
}

// Root-level summary
export interface LibParsedVulnerability {
  level: number;
  label: string;
  cveCount: number;
  libraryCount: number;
  child: LibraryNode[];
}

export interface CVSSv3 {
  attackVector?: string;
  attackComplexity?: string;
  privilegesRequired?: string;
  userInteraction?: string;
  scope?: string;
  confidentialityImpact?: string;
  integrityImpact?: string;
  availabilityImpact?: string;
  impactSubscore?: number;
  exploitabilitySubscore?: number;
  baseScore?: number;
  vector?: string;
  severity?: string;
}

export interface CVE {
  id?: number;
  name?: string;
  description?: string;
  status?: string;
  cwe?: string;
  epssScore?: number;
  epssPercentile?: number;
  cisa?: boolean;
  cvssScoreSource?: string | null;
  nvdPublished?: number;
  nvdModified?: number;
  cvssv3?: CVSSv3;
  cvssv2?: any;
  firstSeen?: number;
}

export interface ImpactStats {
  impactedAppCount?: number;
  totalAppCount?: number;
  impactedServerCount?: number;
  totalServerCount?: number;
  appPercentage?: number;
  serverPercentage?: number;
  impactStats?: any;
}

export interface Library {
  hash?: string;
  version?: string;
  file_name?: string;
  group?: string;
}

export interface App {
  name?: string;
  app_id?: string;
  last_seen?: number;
  last_reset?: number | null;
  first_seen?: number;
  importance_description?: string;
}

export interface Server {
  server_id?: number;
  name?: string;
  hostname?: string;
  path?: string;
  type?: string;
  environment?: string;
  status?: string;
}

export interface CVEOverviewResponse {
  cve: CVE;
  impactStats?: ImpactStats;
  libraries?: Library[];
  apps?: App[];
  servers?: Server[];
}

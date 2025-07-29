import React, { useEffect, useRef, useState } from 'react';
import {
  ContrastAssessLocale,
  LibraryReportOverview,
  PassLocalLang,
  ReducerTypes,
} from '../../../../../../common/types';
import {
  CVENode,
  LibParsedVulnerability,
} from '../../../../../../vscode-extension/api/model/api.interface';
import {
  getSeverityColor,
  scaOverviewUpdateForCve,
} from '../../../../../utils/helper';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useSelector } from 'react-redux';
import { renderContent } from '../../../../../utils/formattedText';

export function CveOverview({
  translate,
  vulnerability,
}: {
  translate: PassLocalLang;
  vulnerability: unknown;
}) {
  const scaFilesState = useSelector(
    (state: ReducerTypes) => state.assessFilter.scaAllFiles
  );

  const [selectedTab, setSelectedTab] = useState('applications');
  const indicatorRef = useRef<HTMLSpanElement | null>(null);
  const applicationsRef = useRef<HTMLButtonElement | null>(null);
  const serversRef = useRef<HTMLButtonElement | null>(null);

  const [severityLevel, setSeverityLevel] = useState<number>();
  const [activeCveId, setActiveCveId] = useState<string | null>(null);
  const [hasDetailedMetrics, setHasDetailedMetrics] = useState(false);
  const [showVectorDetails, setShowVectorDetails] = useState<boolean>(true);

  const [cveData, setCveData] = useState<Partial<CVENode> | null>({
    label: '',
    level: 1,
    overview: {
      cisa: false,
      cveRecordLink: '',
      description: '',
      firstSeen: '',
      nvdModified: '',
      nvdPublished: '',
      nvdRecordLink: '',
      severity: '',
      severityAndMetrics: [],
      vector: {
        label: '',
        vectors: [],
      },
      organizationalImpact: [
        {
          name: 'Applications',
          totalAppCount: 0,
          impactedAppCount: 0,
          appPercentage: 0,
        },
        {
          name: 'Servers',
          totalServerCount: 0,
          impactedServerCount: 0,
          serverPercentage: 0,
        },
      ],
      applications: [],
      servers: [],
      cvss_3_severity_value: 0,
      epss_percentile: 0,
      epss_score: 0,
    },
  });

  const [cveMetadata, setCveMetadata] = useState<LibraryReportOverview>({
    formFields: {
      cve: {
        firstSeen: { translate: 'First seen in Contrast' },
        nvdPublished: { translate: 'NVD Published' },
        nvdLastModified: { translate: 'NVD Last Modified' },
        nvdLatestInformation: { translate: 'See NVD for latest information' },
        cveOrg: { translate: 'See in cve.org' },
        severityAndMetrics: { translate: 'Severity and Metrics' },
        vector: { translate: 'Vector' },
        description: { translate: 'Description' },
        organizationalImpact: {
          translate: 'Organizational Impact',
        },
      },
    },
  });

  useEffect(() => {
    if (translate !== null && translate !== undefined) {
      const locale = translate as unknown as ContrastAssessLocale;
      const overview = locale?.librariesReport?.tabs?.overView;
      if (overview !== undefined && overview !== null) {
        setCveMetadata(overview as LibraryReportOverview);
      }
    }
  }, [translate]);

  useEffect(() => {
    if (vulnerability !== null && vulnerability !== undefined) {
      const parsed = vulnerability as CVENode;

      if (parsed.level === 0) {
        setActiveCveId(parsed.label ?? '');
        setCveData(parsed);
        setSeverityLevel(parsed.level);

        const hasMetrics =
          (parsed.overview?.severityAndMetrics?.length ?? 0) > 1 ||
          (parsed.overview?.vector?.vectors?.length ?? 0) > 1;

        setHasDetailedMetrics(hasMetrics);
      } else {
        setSeverityLevel(-1);
      }
    }
  }, [vulnerability]);

  useEffect(() => {
    if (
      scaFilesState !== null &&
      scaFilesState !== undefined &&
      scaFilesState.responseData !== null &&
      scaFilesState.responseData !== undefined &&
      !hasDetailedMetrics &&
      activeCveId !== null &&
      activeCveId !== undefined
    ) {
      const parsedData = scaFilesState.responseData as LibParsedVulnerability;

      let matched: CVENode | undefined;

      parsedData?.child?.find((node) => {
        const match = node?.child?.find((item) => item?.label === activeCveId);
        if (match !== undefined) {
          matched = match;
        }
        return !!match;
      });

      if (matched !== null && matched !== undefined) {
        scaOverviewUpdateForCve(matched);

        setCveData(matched);
      }
    }
  }, [scaFilesState, hasDetailedMetrics, activeCveId]);

  // Adjust underline position when tab changes
  const updateTabIndicator = () => {
    const selectedEl =
      selectedTab === 'applications'
        ? applicationsRef.current
        : serversRef.current;

    if (selectedEl && indicatorRef.current) {
      const { offsetLeft, offsetWidth } = selectedEl;
      indicatorRef.current.style.left = `${offsetLeft}px`;
      indicatorRef.current.style.width = `${offsetWidth}px`;
    }
  };

  useEffect(() => {
    requestAnimationFrame(() => updateTabIndicator());
  }, []);

  useEffect(() => {
    updateTabIndicator();
  }, [selectedTab]);

  return (
    <>
      {severityLevel === 0 && (
        <div className="cve-drawer">
          <div className="cve-drawer__header">
            <div className="cve-drawer__file-info">
              <span
                className="severity"
                style={{
                  background: getSeverityColor(
                    cveData?.overview?.severity ?? ''
                  ),
                }}
              >
                {cveData?.overview?.severity}
              </span>
              <span className="cve-drawer__file-name">{cveData?.label}</span>
            </div>

            <div className="cve-drawer__metadata">
              <div className="cve-drawer__metadata-item">
                {cveMetadata?.formFields?.cve?.firstSeen.translate} :{' '}
                {cveData?.overview?.firstSeen !== undefined
                  ? cveData.overview.firstSeen
                  : 'none'}
              </div>
              <div className="cve-drawer__metadata-item">
                {cveMetadata.formFields?.cve?.nvdPublished.translate} :{' '}
                {cveData?.overview?.nvdPublished !== undefined
                  ? cveData?.overview?.nvdPublished
                  : 'none'}
              </div>
              <div className="cve-drawer__metadata-item">
                {cveData?.overview?.nvdRecordLink !== undefined && (
                  <a
                    href={cveData.overview.nvdRecordLink}
                    className="link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>
                      {
                        cveMetadata.formFields?.cve?.nvdLatestInformation
                          .translate
                      }
                    </span>
                    <OpenInNewIcon style={{ fontSize: '12px' }} />
                  </a>
                )}
              </div>
              <div className="cve-drawer__metadata-item">
                {cveData?.overview?.cveRecordLink !== undefined && (
                  <a
                    href={cveData.overview.cveRecordLink}
                    className="link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>{cveMetadata.formFields?.cve?.cveOrg.translate}</span>
                    <OpenInNewIcon style={{ fontSize: '12px' }} />
                  </a>
                )}
              </div>
            </div>
          </div>

          <hr className="hr" />

          {cveData?.overview?.severityAndMetrics !== undefined &&
            cveData?.overview?.severityAndMetrics?.length > 0 && (
              <div className="cve-severity-metrics">
                <div className="title">
                  {cveMetadata.formFields?.cve?.severityAndMetrics.translate}
                </div>
                <div className="metrics-stacks">
                  {cveData.overview.severityAndMetrics.map((item, index) => (
                    <div className="metric-item" key={index}>
                      <div className="name">{item.name}</div>
                      <div
                        className="severity"
                        style={{ background: getSeverityColor(item.severity) }}
                      >
                        {item.score}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {cveData?.overview?.vector?.label !== undefined &&
            cveData.overview.vector.label.length > 0 && (
              <div className="cve-severity-vector">
                <div className="title">
                  {cveMetadata.formFields?.cve?.vector.translate}
                </div>
                <div className="content">{cveData.overview.vector.label}</div>

                {showVectorDetails &&
                  cveData.overview?.vector?.vectors !== undefined &&
                  cveData.overview?.vector?.vectors?.length > 0 && (
                    <div className="vector-stacks-outer">
                      <div className="vector-stacks">
                        {cveData.overview.vector.vectors.map((item, index) => (
                          <div className="vector-item" key={index}>
                            <div className="text">{item.label}</div>
                            <div className="type">{item.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {cveData.overview.vector.vectors !== undefined &&
                  cveData.overview.vector.vectors?.length > 0 && (
                    <div
                      className="show"
                      onClick={() => setShowVectorDetails((prev) => !prev)}
                    >
                      <span>Show {showVectorDetails ? 'less' : 'more'}</span>
                      {showVectorDetails ? (
                        <KeyboardArrowUpIcon fontSize="small" />
                      ) : (
                        <KeyboardArrowDownIcon fontSize="small" />
                      )}
                    </div>
                  )}
              </div>
            )}

          <div className="cve-severity-description">
            <div className="title">
              {cveMetadata.formFields?.cve?.description.translate}
            </div>
            <div
              className="content"
              dangerouslySetInnerHTML={{
                __html: renderContent(cveData?.overview?.description ?? ''),
              }}
            />
          </div>

          <div className="organizational-impact-container">
            <div className="title">
              {cveMetadata.formFields?.cve?.organizationalImpact.translate}
            </div>
            <div className="impact-card-list">
              <div className="impact-card-group">
                <div className="impact-card">
                  <div className="impact-card-header">
                    <div className="impact-label">Applications</div>
                    <div className="impact-metrics">
                      <div>
                        {(cveData?.overview?.organizationalImpact !==
                          undefined &&
                          cveData?.overview?.organizationalImpact[0]
                            .impactedAppCount) ??
                          0}
                      </div>
                      <div>
                        /{' '}
                        {(cveData?.overview?.organizationalImpact !==
                          undefined &&
                          cveData?.overview?.organizationalImpact[0]
                            .totalAppCount) ??
                          0}
                      </div>
                      <div>
                        (
                        {(cveData?.overview?.organizationalImpact !==
                          undefined &&
                          Number(
                            cveData?.overview?.organizationalImpact[0]
                              .appPercentage
                          ).toFixed(2)) ??
                          0}
                        )%
                      </div>
                    </div>
                  </div>
                </div>
                <div className="impact-card">
                  <div className="impact-card-header">
                    <div className="impact-label">Servers</div>
                    <div className="impact-metrics">
                      <div>
                        {(cveData?.overview?.organizationalImpact !==
                          undefined &&
                          cveData?.overview?.organizationalImpact[1]
                            .impactedServerCount) ??
                          0}
                      </div>
                      <div>
                        /{' '}
                        {(cveData?.overview?.organizationalImpact !==
                          undefined &&
                          cveData?.overview?.organizationalImpact[1]
                            .totalServerCount) ??
                          0}
                      </div>
                      <div>
                        (
                        {(cveData?.overview?.organizationalImpact !==
                          undefined &&
                          Number(
                            cveData?.overview?.organizationalImpact[1]
                              .serverPercentage
                          ).toFixed(2)) ??
                          0}
                        )%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div>
            <div role="tablist" className="ds-tablist-container">
              <button
                ref={applicationsRef}
                type="button"
                role="tab"
                aria-selected={selectedTab === 'applications'}
                data-selected={selectedTab === 'applications'}
                className={`ds-tab ${
                  selectedTab === 'applications'
                    ? 'ds-tab--active'
                    : 'ds-tab--inactive'
                }`}
                id="tab-applications"
                aria-controls="tabpanel-applications"
                onClick={() => setSelectedTab('applications')}
              >
                Applications
              </button>
              <button
                ref={serversRef}
                type="button"
                role="tab"
                aria-selected={selectedTab === 'servers'}
                data-selected={selectedTab === 'servers'}
                className={`ds-tab ${
                  selectedTab === 'servers'
                    ? 'ds-tab--active'
                    : 'ds-tab--inactive'
                }`}
                id="tab-servers"
                aria-controls="tabpanel-servers"
                onClick={() => setSelectedTab('servers')}
              >
                Servers
              </button>
              <span
                ref={indicatorRef}
                data-testid="tab-indicator"
                className="ds-tab-indicator"
              ></span>
            </div>

            <div className="ds-tab-content">
              {selectedTab === 'applications' &&
                cveData?.overview?.applications?.map((item) => {
                  return <div>{item}</div>;
                })}
              {selectedTab === 'servers' &&
                cveData?.overview?.servers?.map((item) => {
                  return <div>{item}</div>;
                })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

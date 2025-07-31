import React, { useEffect, useState } from 'react';
import {
  ContrastAssessLocale,
  LibraryReportOverview,
  PassLocalLang,
} from '../../../../../../common/types';
import { LibraryNode } from '../../../../../../vscode-extension/api/model/api.interface';
import {
  getGradeColorKey,
  getSeverityColor,
} from '../../../../../utils/helper';
import { CveOverview } from './CveOverview';
import { Tooltip } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';

export function LibraryOverview({
  translate,
  vulnerability,
}: {
  translate: PassLocalLang;
  vulnerability: unknown;
}) {
  const [level, setLevel] = useState<number>();
  const [overviewData, setOverView] = useState<Partial<LibraryNode> | null>({
    overview: {
      file_name: '',
      version: '',
      release_date: '',
      hash: '',
      licenses: [],
      grade: '',
      score: 0,
      total_vulnerabilities: 0,
      policy_violations: 0,
      apps_using: 0,
      classes_used: 0,
      class_count: 0,
      app_language: '',
    },
    child: [],
  });
  useEffect(() => {
    if (vulnerability !== null && vulnerability !== undefined) {
      const response = vulnerability as unknown as LibraryNode;
      setOverView(response);
      setLevel(response.level);
    } else {
      setLevel(-1);
    }
  }, [vulnerability]);

  const [properties, setProperties] = useState<LibraryReportOverview>({
    formFields: {
      library: {
        released: {
          translate: 'Released',
        },
        identifier: {
          translate: 'Identifier',
        },
        license: {
          translate: 'License',
        },
        vulnerability: {
          translate: 'Vulnerability',
        },
        policyViolations: {
          translate: 'Policy Violations',
        },
        appsUsing: {
          translate: 'Apps Using',
        },
        classesUsed: {
          translate: 'Classes Used',
        },
        whatHappened: {
          translate: 'What happened?',
          placeholder: 'This library has known CVEs.',
        },
        whatTheRisk: {
          translate: "What's the risk?",
        },
      },
    },
  });

  useEffect(() => {
    if (translate !== null && translate !== undefined) {
      const response = translate as unknown as ContrastAssessLocale;
      const overView = response.librariesReport?.tabs?.overView;
      setProperties(overView as LibraryReportOverview);
    }
  }, [translate]);

  return (
    <>
      {level === 1 && (
        <div className="library-drawer">
          <div className="library-drawer__header">
            <div className="library-drawer__file-info">
              <span className="library-drawer__file-name">
                {overviewData?.overview?.file_name}
              </span>
              <span className="library-drawer__file-version">
                {overviewData?.overview?.version}
              </span>
            </div>

            <div className="library-drawer__metadata">
              <div className="library-drawer__metadata-item right-border">
                <span className="bold">
                  {properties.formFields?.library?.released.translate} {' : '}
                </span>
                {overviewData?.overview?.release_date}
              </div>
              <div className="library-drawer__metadata-item right-border">
                <span className="bold">
                  {properties.formFields?.library?.identifier.translate} {' : '}
                </span>
                {overviewData?.overview?.hash}
              </div>
              <div className="library-drawer__metadata-item">
                <span className="bold">
                  {properties.formFields?.library?.license.translate} {' : '}
                </span>
                {overviewData?.overview?.licenses.join('')}
              </div>
            </div>
          </div>
          <hr className="hr"></hr>
          <div className="library-drawer__body">
            <div className="library-summary-container">
              <div className="library-summary">
                <div className="library-summary__score">
                  <div
                    className="library-summary__score-grade"
                    style={{
                      background: getGradeColorKey(
                        overviewData?.overview?.grade ?? ''
                      ),
                    }}
                  >
                    <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
                      {overviewData?.overview?.grade}
                    </div>
                  </div>
                  <div className="library-summary__progress-bar">
                    <div className="score">
                      <span> {overviewData?.overview?.score}</span> / 100
                    </div>
                    <div className="progress-bar-outer">
                      <div
                        style={{
                          width: `${
                            String(overviewData?.overview?.score ?? '') || 0
                          }%`,
                          background: getGradeColorKey(
                            overviewData?.overview?.grade ?? ''
                          ),
                        }}
                        className="progress-bar-inner"
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="library-summary__item">
                  <div className="title">
                    {overviewData?.overview?.total_vulnerabilities}
                  </div>
                  <div>
                    {properties.formFields?.library?.vulnerability.translate}
                  </div>
                </div>

                <div className="library-summary__item">
                  <div className="title">
                    {overviewData?.overview?.policy_violations}
                  </div>
                  <div>
                    {properties.formFields?.library?.policyViolations.translate}
                  </div>
                </div>
                <div className="library-summary__item">
                  <div className="title">
                    {overviewData?.overview?.apps_using}
                  </div>
                  <div>
                    {properties.formFields?.library?.appsUsing.translate}
                  </div>
                </div>
              </div>
              <div className="library-summary__item">
                <div className="title" style={{ color: 'rgb(13, 161, 169)' }}>
                  <span> {overviewData?.overview?.classes_used}</span>
                  <span style={{ color: 'rgb(142, 196, 199)' }}>
                    / {overviewData?.overview?.class_count}
                  </span>
                </div>
                <div>
                  {properties.formFields?.library?.classesUsed.translate}
                </div>
              </div>
            </div>

            {overviewData?.child && overviewData?.child.length > 0 && (
              <>
                <div className="whatHappend">
                  <div className="bigTitle">
                    {properties.formFields?.library?.whatHappened.translate}
                  </div>
                  <div className="content">
                    {properties.formFields?.library?.whatHappened.placeholder}
                  </div>
                </div>
                <div className="whatRisk">
                  <table>
                    <thead>
                      <tr>
                        <th>
                          <div className="bigTitle">
                            {
                              properties.formFields?.library?.whatTheRisk
                                .translate
                            }
                          </div>
                        </th>
                        <th>
                          <div className="bigTitle epss">
                            <span>EPSS</span>
                            <Tooltip
                              title={`The EPSS score is based on the likelihood of a vulnerability being exploited. It has a probability range from 0 to 1 The higher the score, the more likely the vulnerability will be exploited in 30 days. Percentile indicates how likely it is to be exploited compared to other vulnerabilities.`}
                              children={
                                <InfoIcon
                                  style={{
                                    fontSize: '15px',
                                    cursor: 'pointer',
                                  }}
                                ></InfoIcon>
                              }
                            ></Tooltip>
                          </div>
                        </th>
                        <th>
                          <div></div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {overviewData?.child?.map((item, index) => (
                        <tr key={index}>
                          <td>
                            <div className="cveRecord">
                              {item.overview.severity && (
                                <div
                                  className="severity"
                                  style={{
                                    background: getSeverityColor(
                                      item.overview.severity ?? ''
                                    ),
                                  }}
                                >
                                  {item.overview.severity}
                                </div>
                              )}
                              <div
                                className="score"
                                style={{
                                  color: getSeverityColor(
                                    item.overview.severity ?? ''
                                  ),
                                }}
                              >
                                {item.overview.cvss_3_severity_value}
                              </div>
                              <div className="name">{item.label}</div>
                            </div>
                          </td>
                          <td>
                            <div className="cveRecord">
                              <div style={{ whiteSpace: 'nowrap' }}>
                                <span style={{ fontWeight: 'bold' }}>
                                  {item.overview.epss_score}
                                </span>{' '}
                                <span>
                                  ( {item.overview.epss_percentile}th
                                  percentile)
                                </span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="exploit">
                              {Boolean(item.overview.cisa)
                                ? 'Known Exploit'
                                : ''}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {level === 0 && (
        <CveOverview translate={translate} vulnerability={vulnerability} />
      )}
    </>
  );
}

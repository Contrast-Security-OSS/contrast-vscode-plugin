import React, { useEffect, useState } from 'react';
import {
  ContrastAssessLocale,
  LibraryReportHowToFix,
  PassLocalLang,
} from '../../../../../../common/types';
import { LibraryNode } from '../../../../../../vscode-extension/api/model/api.interface';
import {
  countOwnEntries,
  getGradeColorKey,
  isOfType,
} from '../../../../../utils/helper';

export function LibraryHowToFix({
  translate,
  vulnerability,
}: {
  translate: PassLocalLang;
  vulnerability: unknown;
}) {
  const [howToFixData, setHowToFix] = useState<Partial<LibraryNode> | null>(
    null
  );
  useEffect(() => {
    if (vulnerability !== null && vulnerability !== undefined) {
      const response = vulnerability as unknown as LibraryNode;
      if (!isOfType<LibraryNode>(response, 'howToFix')) {
        return;
      }
      if (
        countOwnEntries(response.howToFix.minUpgrade) > 0 ||
        countOwnEntries(response.howToFix.maxUpgrade) > 0
      ) {
        setHowToFix(response);
      } else {
        setHowToFix(null);
      }
    } else {
      setHowToFix(null);
    }
  }, [vulnerability]);

  const [properties, setProperties] = useState<LibraryReportHowToFix>({
    translate: 'How To Fix',
    placeholder: 'No recommended fixes.',
    minimumUpgrade: {
      translate: 'Minimum upgrade',
      placeholder: 'We recommend upgrading to',
    },
    latestStable: {
      translate: 'Latest stable',
      placeholder: 'We recommend upgrading to',
    },
  });

  useEffect(() => {
    if (translate !== null && translate !== undefined) {
      const response = translate as unknown as ContrastAssessLocale;
      const howToFix = response.librariesReport?.tabs
        ?.howToFix as LibraryReportHowToFix;
      setProperties(howToFix);
    }
  }, [translate]);

  return (
    <>
      {howToFixData !== null ? (
        <div className="library-how-to-fix">
          <div className="title">{properties.translate}</div>
          <div className="upgrade-summary">
            <div className="header">{properties.minimumUpgrade?.translate}</div>
            <div className="content">
              {properties.minimumUpgrade?.placeholder}
            </div>
            <div
              className="grade-summary"
              style={{
                background: getGradeColorKey(
                  howToFixData?.howToFix?.minUpgrade.grade ?? ''
                ),
              }}
            >
              <span>{howToFixData?.howToFix?.minUpgrade.grade}</span>
            </div>
            <div className="score">
              {howToFixData?.howToFix?.minUpgrade.version}
            </div>
          </div>
          <div className="upgrade-summary">
            <div className="header"> {properties.latestStable?.translate} </div>
            <div className="content">
              {properties.latestStable?.placeholder}
            </div>
            <div
              className="grade-summary"
              style={{
                background: getGradeColorKey(
                  howToFixData?.howToFix?.maxUpgrade.grade ?? ''
                ),
              }}
            >
              <span> {howToFixData?.howToFix?.maxUpgrade.grade}</span>
            </div>
            <div className="score">
              {howToFixData?.howToFix?.maxUpgrade.version}
            </div>
          </div>
        </div>
      ) : (
        <span>{properties.placeholder}</span>
      )}
    </>
  );
}

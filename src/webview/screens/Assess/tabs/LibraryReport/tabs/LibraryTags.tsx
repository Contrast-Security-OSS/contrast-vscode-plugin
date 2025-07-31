import React, { useEffect, useState } from 'react';
import {
  ContrastAssessLocale,
  PassLocalLang,
  ReducerTypes,
} from '../../../../../../common/types';
import {
  ContrastDropdown,
  ContrastOption,
} from '../../../../../components/DropDown';
import Input from '../../../../../components/Input';
import { Button } from '../../../../../components/Button';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { Tooltip } from '@mui/material';
import { webviewPostMessage } from '../../../../../utils/postMessage';
import {
  WEBVIEW_COMMANDS,
  WEBVIEW_SCREENS,
} from '../../../../../../vscode-extension/utils/constants/commands';
import { useSelector } from 'react-redux';
import { setScaTagsOkBehaviour } from '../../../../../utils/redux/slices/assessFilter';
import ContrastStore from '../../../../../utils/redux/store';
import {
  LibParsedVulnerability,
  LibraryNode,
} from '../../../../../../vscode-extension/api/model/api.interface';
import { getLibraryNodeByUuid } from '../../../../../utils/helper';

interface OrgDropdownProps {
  value: string | string[];
  additionalProps?: string | object;
}

type TagType = {
  name: string;
  type?: number;
};

export function LibraryTags({
  translate,
  vulnerability,
}: {
  translate: PassLocalLang;
  vulnerability: unknown;
}) {
  const fetchOrgTags = useSelector(
    (state: ReducerTypes) => state.assessFilter.scaOrgTags
  );
  const fetchTagBehaviour = useSelector(
    (state: ReducerTypes) => state.assessFilter.scaTagsOkBehaviour
  );

  const fetchAllFiles = useSelector(
    (state: ReducerTypes) => state.assessFilter.scaAllFiles
  );

  const [exitingTagState, setExistingTagState] = useState(true);

  const [tagLocale, setTagLocale] = useState({
    applyExistingTag: 'Apply existing tag',
    createAndApplyNewTag: 'Create and apply a new tag',
    appliedTag: 'Applied tag',
    nothingToShow: 'Nothing to show',
    tag: 'Tag',
    create: {
      btn: 'Create',
      tooltip: 'Create',
    },
    ok: {
      btn: 'Ok',
      tooltip: 'Ok',
    },
    clear: {
      btn: 'Clear',
      tooltip: 'Clear',
    },
    delete: {
      tooltip: 'Delete',
    },
  });
  const [orgTags, setOrgTags] = useState<TagType[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [choosedTags, setChoosedTags] = useState<TagType[]>([]);
  const [tagsToRemove, setTagsToRemove] = useState<TagType[]>([]);
  const [disbleFields, setDisbleFields] = useState({
    create: true,
    delete: true,
  });
  const [okState, setOkState] = useState(false);
  const [activeTagItem, setActiveTagItem] = useState('');
  const [activeTag, setActiveTag] = useState<TagType | null>(null);
  const [currentUuid, setCurrentUuid] = useState<LibraryNode | null>(null);
  useEffect(() => {
    if (translate !== null && translate !== undefined) {
      const response = translate as unknown as ContrastAssessLocale;
      const aboutTagsLocale = response.vulnerabilityReport?.tabs?.tags;
      const btnLocale = response.buttons;
      const tooltipLocale = response.tooltips;
      let allLocale = { ...tagLocale };
      allLocale = {
        ...allLocale,
        create: {
          btn: btnLocale?.create?.translate ?? allLocale.create.btn,
          tooltip: tooltipLocale?.create?.translate ?? allLocale.create.tooltip,
        },
        ok: {
          btn: btnLocale?.ok?.translate ?? allLocale.ok.btn,
          tooltip: tooltipLocale?.ok?.translate ?? allLocale.ok.tooltip,
        },
        clear: {
          btn: btnLocale?.clear?.translate ?? allLocale.clear.btn,
          tooltip: tooltipLocale?.clear?.translate ?? allLocale.clear.tooltip,
        },
        delete: {
          tooltip: tooltipLocale?.delete?.translate ?? allLocale.delete.tooltip,
        },
      };
      if (aboutTagsLocale !== null && aboutTagsLocale !== undefined) {
        allLocale = {
          ...allLocale,
          applyExistingTag:
            aboutTagsLocale.formFields?.applyExistingTag.translate ??
            allLocale.applyExistingTag,
          createAndApplyNewTag:
            aboutTagsLocale.formFields?.createAndApplyNewTag.translate ??
            allLocale.createAndApplyNewTag,
          appliedTag:
            aboutTagsLocale.formFields?.appliedTag.translate ??
            allLocale.appliedTag,
          tag: aboutTagsLocale.formFields?.tag.translate ?? allLocale.tag,
          nothingToShow:
            aboutTagsLocale.formFields?.tag.placeholder ??
            allLocale.nothingToShow,
        };
      }
      setTagLocale(allLocale);
    }
  }, [translate]);

  useEffect(() => {
    if (vulnerability !== null && vulnerability !== undefined) {
      const node = vulnerability as LibraryNode;
      setCurrentUuid(node ?? null);
      webviewPostMessage({
        command: WEBVIEW_COMMANDS.SCA_ORG_TAGS,
        payload: vulnerability,
        screen: WEBVIEW_SCREENS.ASSESS,
      });
    }
  }, [vulnerability]);

  useEffect(() => {
    if (
      fetchAllFiles !== undefined &&
      fetchAllFiles !== null &&
      fetchAllFiles.responseData !== null &&
      fetchAllFiles.responseData !== undefined
    ) {
      const vul = fetchAllFiles.responseData as LibParsedVulnerability;
      if (vul !== null && vul !== undefined && currentUuid !== null) {
        const data = getLibraryNodeByUuid(
          vul,
          currentUuid.overview.hash,
          currentUuid.isUnmapped
        );
        if (data !== null && data !== undefined) {
          if (
            'tags' in data &&
            data?.tags !== null &&
            data?.tags !== undefined &&
            data.tags.length > 0
          ) {
            const datas = data.tags.map((item) => ({
              name: item,
              type: 1,
            })) as unknown as TagType[];
            setChoosedTags(datas);
          }
        }
      }
    }
  }, [fetchAllFiles, currentUuid]);

  useEffect(() => {
    setOkState(fetchTagBehaviour);
  }, [fetchTagBehaviour]);

  useEffect(() => {
    if (
      fetchOrgTags !== null &&
      fetchOrgTags !== undefined &&
      fetchOrgTags.responseData !== undefined &&
      fetchOrgTags.responseData !== null &&
      (fetchOrgTags.responseData as Array<string>).length > 0
    ) {
      setExistingTagState(true);
      const data = fetchOrgTags.responseData as Array<string>;
      const datas = data
        .map((item) => ({
          name: item,
          type: 0,
        }))
        .filter(
          (tagLoop) => !choosedTags.find((item) => item.name === tagLoop.name)
        );

      setOrgTags(datas);
      if (datas.length > 0) {
        setActiveTagItem((datas[0].name as string) ?? '');
      }
      setExistingTagState(false);
    }
  }, [fetchOrgTags]);

  const handleOrgTagSelection = (event: OrgDropdownProps) => {
    setActiveTagItem(event.value as string);
    if (!choosedTags.some((item) => item.name === event.value)) {
      setChoosedTags([
        ...choosedTags,
        { name: event.value as string, type: 0 },
      ]);
      setExistingTagState(true);
      setOrgTags(orgTags.filter((item) => item.name !== event.value));
      setExistingTagState(false);
    }
  };

  const handleNewTag = (e: string) => {
    const text = e.replace(/\s+/g, ' ').trim();
    setInputValue(text);
    setDisbleFields((prev) => ({ ...prev, create: text.length === 0 }));
  };

  const handleCreateTag = () => {
    if (orgTags.some((item) => item.name === inputValue)) {
      webviewPostMessage({
        command: WEBVIEW_COMMANDS.COMMON_MESSAGE,
        payload: {
          data: WEBVIEW_COMMANDS.ASSESS_TAG_ALREADY_AVAILABLE,
          time: Math.random() * 10,
        },
        screen: WEBVIEW_SCREENS.ASSESS,
      });
      setInputValue('');
    } else if (choosedTags.some((item) => item.name === inputValue)) {
      webviewPostMessage({
        command: WEBVIEW_COMMANDS.COMMON_MESSAGE,
        payload: {
          data: WEBVIEW_COMMANDS.ASSESS_TAG_ALREADY_APPLIED,
          time: Math.random() * 10,
        },
        screen: WEBVIEW_SCREENS.ASSESS,
      });
      setInputValue('');
    } else if (inputValue.length > 72) {
      webviewPostMessage({
        command: WEBVIEW_COMMANDS.COMMON_MESSAGE,
        payload: {
          data: WEBVIEW_COMMANDS.ASSESS_TAG_LENGTH_EXCEEDED,
          time: Math.random() * 10,
        },
        screen: WEBVIEW_SCREENS.ASSESS,
      });
      setInputValue('');
    } else {
      setChoosedTags([...choosedTags, { name: inputValue, type: 3 }]);
      setInputValue('');
    }
  };

  const handleDeleteTag = () => {
    if (activeTag) {
      setChoosedTags(
        choosedTags.filter((item) => item.name !== activeTag.name)
      );
      activeTag.type === 0
        ? setOrgTags([...orgTags, { name: activeTag.name, type: 0 }])
        : setTagsToRemove([...tagsToRemove, activeTag]);
      setActiveTag(null);
      setDisbleFields((prev) => ({ ...prev, delete: true }));
    }
  };

  const handleChildChange = (e: string, additionalProps?: TagType) => {
    setDisbleFields((prev) => ({ ...prev, delete: false }));
    additionalProps && setActiveTag(additionalProps);
  };

  const handleOk = () => {
    const removeTags = tagsToRemove
      .map((item) => item.name)
      .filter((rItem) => !choosedTags.some((item) => item.name === rItem));

    if (
      currentUuid !== null &&
      currentUuid !== undefined &&
      currentUuid?.overview?.hash !== null &&
      currentUuid?.overview?.hash !== undefined
    ) {
      ContrastStore.dispatch(setScaTagsOkBehaviour(true));
      webviewPostMessage({
        command: WEBVIEW_COMMANDS.SCA_TAG_OK_BEHAVIOUR,
        payload: {
          uuid: currentUuid?.overview.hash ?? null,
          tags: choosedTags.map((item) => item.name),
          tags_remove: removeTags,
          isUnmapped: currentUuid?.isUnmapped,
        },
        screen: WEBVIEW_SCREENS.ASSESS,
      });
    }
    setOkState(false);
    webviewPostMessage({
      command: WEBVIEW_COMMANDS.SCA_ORG_TAGS,
      payload: null,
      screen: WEBVIEW_SCREENS.ASSESS,
    });
  };

  return (
    <div className="tags">
      <div className="tag-container">
        <div className="feature">
          <div className="feature-label">{tagLocale.applyExistingTag}</div>
          <div style={{ width: '150px' }}>
            <ContrastDropdown
              id="orgTagDropdown"
              value={activeTagItem}
              onChange={handleOrgTagSelection}
              hasSearchBox={true}
              isDisabled={exitingTagState}
            >
              {orgTags.map((tag, index) => (
                <ContrastOption
                  key={index}
                  value={tag.name}
                  additionalProps={tag}
                >
                  {tag.name}
                </ContrastOption>
              ))}
            </ContrastDropdown>
          </div>
        </div>
        <div className="feature">
          <div className="feature-label">{tagLocale.createAndApplyNewTag}</div>
          <div className="new-tag">
            <Input
              id="contrastURL"
              type="text"
              value={inputValue}
              name="contrastURL"
              placeholder=""
              onChange={(e) => handleNewTag(e.target.value)}
            />
            <Button
              onClick={handleCreateTag}
              title={tagLocale.create.btn}
              id="create"
              color="btn-blue"
              isDisable={disbleFields.create}
              tooltip={tagLocale.create.tooltip}
            />
            <Tooltip title={tagLocale.delete.tooltip}>
              <DeleteOutlineOutlinedIcon
                fontSize="medium"
                className="deleteIcon"
                style={{
                  color: disbleFields.delete ? 'gray' : '#F44336',
                  cursor: disbleFields.delete ? 'not-allowed' : 'pointer',
                }}
                onClick={handleDeleteTag}
              />
            </Tooltip>
          </div>
        </div>
        <div className="feature">
          <div className="feature-label">{tagLocale.appliedTag}</div>
          <div className="tag-list-container">
            <div className="tag-header">{tagLocale.tag}</div>
            {choosedTags.length > 0 ? (
              <div className="tag-lists">
                {choosedTags.map((item, index) => (
                  <div
                    className={`tag-item ${activeTag?.name === item.name ? 'tag-active' : ''}`}
                    key={index}
                    onClick={() => {
                      handleChildChange(item.name, item);
                    }}
                  >
                    {item.name}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-tag-lists">{tagLocale.nothingToShow}</div>
            )}
          </div>
        </div>
      </div>
      <div className="button-group">
        <Button
          onClick={handleOk}
          title={tagLocale.ok.btn}
          id="ok"
          color="btn-blue"
          tooltip={tagLocale.ok.tooltip}
          isDisable={okState}
        />
        <Button
          onClick={() => {
            setInputValue('');
            setDisbleFields({ ...disbleFields, create: true });
          }}
          title={tagLocale.clear.btn}
          id="clear"
          color="btn-blue"
          tooltip={tagLocale.clear.tooltip}
        />
      </div>
    </div>
  );
}

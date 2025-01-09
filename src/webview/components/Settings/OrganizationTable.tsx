import React, { useEffect, useState } from 'react';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { useSelector } from 'react-redux';
import {
  ConfiguredProject,
  ContrastOrganizationLocales,
  LocalizationJSON,
  ReducerTypes,
} from '../../../common/types';
import { organizationLocale } from '../../utils/constant';
import { Tooltip } from '@mui/material';

interface OrganizationTable {
  dataSource: ConfiguredProject[];
  onChange: (e: ConfiguredProject) => void;
  onDelete: (e: ConfiguredProject) => void;
  isDeselect: {
    deselectRow: boolean;
    updateDeselect: (value: boolean) => void;
  };
}

const OrganizationTable = ({
  dataSource,
  onChange,
  onDelete,
  isDeselect,
}: OrganizationTable) => {
  // -------------------------- use states -------------------------------
  const [selectedRow, setSelectedRow] = useState<ConfiguredProject | null>(
    null
  );

  const activeLanguage = useSelector((state: ReducerTypes) => state.i10ln.data);
  const [localesFields, updateLocaleFields] =
    useState<ContrastOrganizationLocales>(organizationLocale);

  const [editorOptions, updateEditorOptions] = useState({
    edit: false,
    delete: false,
  });

  // -------------------------- use effects -----------------------------

  useEffect(() => {
    setSelectedRow(null);
  }, [dataSource]);

  useEffect(() => {
    if (activeLanguage !== null && activeLanguage !== undefined) {
      const { organization, tooltips } =
        activeLanguage as LocalizationJSON['contrastSettings'];

      updateLocaleFields({
        organization,
        tooltips,
      });
    }
  }, [activeLanguage]);

  useEffect(() => {
    if (isDeselect.deselectRow) {
      setSelectedRow(null);
      isDeselect.updateDeselect(false);
      updateEditorOptions({ delete: false, edit: false });
    }
  }, [isDeselect]);

  // ---------------------------- Methods ---------------------------------

  const isRowSelected = (rowIndex: number | string) => {
    return rowIndex === selectedRow?.id;
  };

  const onrowChange = (rowIndex: ConfiguredProject) => {
    if (rowIndex !== null) {
      setSelectedRow(rowIndex);
    }
  };

  const updateConfiguredProject = (selectedRow: ConfiguredProject) => {
    if (selectedRow !== null) {
      onChange(selectedRow);
    }
  };

  return (
    <>
      <div className="org-div">
        <div
          className="float-right org-actions"
          style={{ visibility: selectedRow !== null ? 'visible' : 'hidden' }}
        >
          <button disabled={editorOptions.edit} className="editor-transparent">
            <Tooltip
              title={localesFields.tooltips.edit.translate}
              children={
                <EditOutlinedIcon
                  fontSize="small"
                  style={
                    !editorOptions.edit
                      ? {
                          color: '#4CAF50',
                          cursor: 'pointer',
                        }
                      : {
                          color: 'gray',
                          cursor: 'not-allowed',
                        }
                  }
                  className="editIcon"
                  onClick={() => {
                    updateEditorOptions({
                      ...editorOptions,
                      delete: true,
                    });
                    updateConfiguredProject(selectedRow as ConfiguredProject);
                  }}
                />
              }
            ></Tooltip>
          </button>
          <button
            disabled={editorOptions.delete}
            className="editor-transparent"
          >
            <Tooltip
              title={localesFields.tooltips.delete.translate}
              children={
                <DeleteOutlineOutlinedIcon
                  fontSize="small"
                  className="deleteIcon"
                  style={
                    !editorOptions.delete
                      ? {
                          color: '#F44336',
                          cursor: 'pointer',
                        }
                      : {
                          color: 'gray',
                          cursor: 'not-allowed',
                        }
                  }
                  onClick={() => {
                    updateEditorOptions({
                      ...editorOptions,
                      edit: true,
                    });
                    onDelete(selectedRow as ConfiguredProject);
                  }}
                />
              }
            ></Tooltip>
          </button>
        </div>
        <div className="table-container">
          <table className="org-table">
            <thead>
              <tr>
                <th>
                  {localesFields?.organization?.organizationName?.translate}
                </th>
                <th>{localesFields?.organization?.projectName.translate}</th>
                <th>{localesFields?.organization?.type.translate}</th>
              </tr>
            </thead>
            <tbody>
              {dataSource.length > 0 ? (
                dataSource.map((row: ConfiguredProject, index: number) => (
                  <tr
                    key={index}
                    onClick={() => onrowChange(row)}
                    style={{
                      backgroundColor: isRowSelected(row?.id as string)
                        ? '#3D9BDB'
                        : '',
                      cursor: 'pointer',
                      color: isRowSelected(row?.id as string)
                        ? 'black'
                        : 'white',
                    }}
                  >
                    <td id="project-added-to-config">
                      {row?.organizationName}
                    </td>
                    <td id="project-added-to-config">{row?.projectName}</td>
                    <td>{row?.source}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default OrganizationTable;

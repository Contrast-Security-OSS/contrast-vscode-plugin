import React, {
  Children,
  useEffect,
  useRef,
  useState,
  ReactElement,
  ReactNode,
  useMemo,
} from 'react';

import { IOption, ReducerTypes, IDropDown } from '../../common/types';
import { useSelector } from 'react-redux';
import { Tooltip } from '@mui/material';
import { customToolTipStyle } from '../utils/helper';

const ContrastOption = ({
  children,
  onClick,
  value,
  style,
  id,
  additionalProps,
  isMulti = false,
  isChecked = false,
}: IOption) => {
  const textRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    if (textRef.current) {
      const isTextOverflowing =
        textRef.current.scrollWidth > textRef.current.clientWidth;
      setIsOverflowing(isTextOverflowing);
    }
  }, [children]);

  return (
    <div
      onClick={() => {
        if (onClick) {
          const payload = {
            value,
            children,
            ...(additionalProps !== undefined &&
              additionalProps !== null && { additionalProps }),
          };
          onClick(payload);
        }
      }}
      className="dropdown-option"
      style={style}
      id={id}
      role="option"
      aria-selected={isChecked}
    >
      <Tooltip
        title={isOverflowing ? children?.toString() : ''}
        children={
          <div className="dropdown-option-label">
            {isMulti && <input type="checkbox" checked={isChecked} readOnly />}
            <span className="dropdown-option-label-text" ref={textRef}>
              {children}
            </span>
          </div>
        }
        placement="bottom-start"
        slotProps={customToolTipStyle}
      />
    </div>
  );
};

const ContrastDropdown = ({
  value,
  children,
  onChange,
  id,
  placeHolder = '',
  isDisabled = false,
  hasSearchBox = false,
  noDataFoundMessage = 'No Data Found',
  isMultiSelect = false,
  isClearable = false,
}: IDropDown) => {
  const contrastTheme = useSelector((state: ReducerTypes) => state.theme.data);
  const [selectedValue, updateSelectValue] = useState(value);
  const [showList, updateShowList] = useState(false);
  const [contrastOptions, updateContrastOptions] = useState<ReactElement[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [inputText, setInputText] = useState('');
  const [cloneContrastOptions, setCloneContrastOptions] = useState<
    ReactElement[]
  >([]);

  const handleDropdownClick = () => updateShowList(!showList);

  useEffect(() => {
    showList === false ? setInputText('') : null;
  }, [showList]);

  useEffect(() => {
    if (selectedRef.current) {
      setIsOverflowing(
        selectedRef.current.scrollWidth > selectedRef.current.clientWidth
      );
    }
  }, [selectedValue, children]);

  useEffect(() => {
    const optionsArray = Children.toArray(children) as ReactElement[];
    updateContrastOptions(optionsArray);
    const selectedOption = optionsArray.find(
      (child) => child.props.value === value
    );
    if (isMultiSelect) {
      updateSelectValue(Array.isArray(value) ? value : [value]);
    } else {
      updateSelectValue(selectedOption ? selectedOption.props.value : '');
    }
    setCloneContrastOptions(optionsArray);
  }, [value, children]);

  const filteredOptions = useMemo(() => {
    if (!inputText) {
      return cloneContrastOptions;
    }

    return cloneContrastOptions.filter((item) =>
      String(item.props.children)
        .toLowerCase()
        .includes(inputText.toLowerCase())
    );
  }, [inputText, cloneContrastOptions]);

  const allOptionValues = useMemo(() => {
    return contrastOptions.map((child) => child.props.value);
  }, [contrastOptions]);

  const isAllSelected = useMemo(() => {
    return (
      isMultiSelect &&
      Array.isArray(selectedValue) &&
      allOptionValues.every((val) => selectedValue.includes(val))
    );
  }, [isMultiSelect, selectedValue, allOptionValues]);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getSelectedOptionLabels = useMemo((): string | string[] => {
    if (!isMultiSelect) {
      const selected = contrastOptions.find(
        (child) => child.props.value === selectedValue
      );
      return selected?.props.children ?? placeHolder;
    }

    if (Array.isArray(selectedValue)) {
      return selectedValue
        .map(
          (val) =>
            contrastOptions.find((child) => child.props.value === val)?.props
              .children
        )
        .filter(Boolean) as string[];
    }

    return placeHolder;
  }, [selectedValue, contrastOptions]);

  const selectedText = useMemo(() => {
    const names = getSelectedOptionLabels;
    if (Array.isArray(names)) {
      return names.length > 0 ? names.join(', ') : placeHolder;
    }
    return names || placeHolder;
  }, [getSelectedOptionLabels, placeHolder]);

  const handleOptionClick = (e: { value: string; children: ReactNode }) => {
    let newValue: string | string[];

    if (isMultiSelect) {
      const prevValues = Array.isArray(selectedValue) ? [...selectedValue] : [];
      if (prevValues.includes(e.value)) {
        newValue = prevValues.filter((val) => val !== e.value);
      } else {
        newValue = [...prevValues, e.value];
      }
      newValue = newValue.filter((item) => item !== '');
    } else {
      newValue = e.value;
      updateShowList(false);
    }

    updateSelectValue(newValue);

    if (onChange) {
      onChange({ ...e, value: newValue });
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node)
    ) {
      updateShowList(false);
    }
  };

  return (
    <div
      className={`dropdown ${isDisabled ? 'disabled' : ''}`}
      ref={dropdownRef}
    >
      <div
        className="control"
        style={{ borderColor: showList ? '#007FD4' : undefined }}
        onClick={(e) => {
          if (isDisabled) {
            e.preventDefault();
          } else {
            handleDropdownClick();
          }
        }}
        id={id}
      >
        <Tooltip
          title={isOverflowing ? selectedText?.toString() : ''}
          placement="bottom-start"
          slotProps={customToolTipStyle}
        >
          <div ref={selectedRef} className="dropdown-label">
            {selectedText}
          </div>
        </Tooltip>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          {selectedValue.length > 0 && !isDisabled && isClearable && (
            <i
              className="fa fa-times clear"
              aria-hidden="true"
              title="Clear selection"
              onClick={(e) => {
                e.stopPropagation();
                isMultiSelect ? updateSelectValue([]) : updateSelectValue('');
                updateShowList(false);
                if (onChange) {
                  isMultiSelect
                    ? onChange({ value: [], children: '' })
                    : onChange({ value: '', children: '' });
                }
              }}
              style={{ cursor: 'pointer' }}
            ></i>
          )}
          <i
            className="fa fa-angle-down"
            aria-hidden="true"
            style={{ fontSize: '20px' }}
          ></i>
        </div>
      </div>
      {showList && (
        <div className="listBox">
          {hasSearchBox && contrastOptions.length > 6 && (
            <div className="search">
              <input
                type="text"
                className="search-input"
                placeholder="Search..."
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                }}
              />
              <div className="Icon">
                {inputText.length > 0 ? (
                  <i
                    className="fa fa-times clear"
                    aria-hidden="true"
                    onClick={() => setInputText('')}
                  ></i>
                ) : (
                  <i className="fa fa-search" aria-hidden="true"></i>
                )}
              </div>
            </div>
          )}
          {filteredOptions.length > 0 ? (
            <>
              {isMultiSelect && (
                <ContrastOption
                  key="select_all"
                  value="__all__"
                  onClick={() => {
                    const newValue = isAllSelected ? [] : allOptionValues;
                    updateSelectValue(newValue);

                    if (onChange) {
                      onChange({ value: newValue, children: 'All' });
                    }
                  }}
                  isMulti={true}
                  isChecked={isAllSelected}
                  style={{
                    fontWeight: 'bold',
                    borderBottom: '1px solid #ccc',
                  }}
                  id={`${id}-select-all`}
                >
                  All
                </ContrastOption>
              )}

              {Children.map(filteredOptions, (child) => {
                const isChecked = Array.isArray(selectedValue)
                  ? selectedValue.includes(child.props.value)
                  : selectedValue === child.props.value;

                const shouldHighlight = !isMultiSelect && isChecked;

                return React.cloneElement(child, {
                  onClick: handleOptionClick,
                  isMulti: isMultiSelect,
                  isChecked,
                  style: shouldHighlight
                    ? {
                        background:
                          contrastTheme === 1 ? 'rgb(88 178 239)' : '#094771',
                        border: '1px solid #007FD4',
                      }
                    : {},
                  id,
                });
              })}
            </>
          ) : (
            <span className="not-found">{noDataFoundMessage}</span>
          )}
        </div>
      )}
    </div>
  );
};

export { ContrastDropdown, ContrastOption };

import React, {
  Children,
  useEffect,
  useRef,
  useState,
  ReactElement,
  ReactNode,
} from 'react';
import './../../styles/dropdown.scss';
import { IDropDown, IOption, ReducerTypes } from '../../common/types';
import { useSelector } from 'react-redux';
const ContrastOption = ({ children, onClick, value, style, id }: IOption) => (
  <div
    onClick={() => {
      if (onClick !== undefined) {
        onClick({ value, children }); // Safely invoke onClick
      }
    }}
    className="dropdown-option"
    style={style}
    id={id}
  >
    {children}
  </div>
);
const ContrastDropdown = ({ value, children, onChange, id }: IDropDown) => {
  const contrastTheme = useSelector((state: ReducerTypes) => state.theme.data);
  const [selectedValue, updateSelectValue] = useState(value);
  const [showList, updateShowList] = useState(false);
  const [contrastOptions, updateContrastOptions] = useState<ReactElement[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const handleDropdownClick = () => updateShowList(!showList);
  useEffect(() => {
    // Updating contrastOptions and setting the selected value based on the initial value.
    const optionsArray = Children.toArray(children) as ReactElement[];
    updateContrastOptions(optionsArray);
    const selectedOption = optionsArray.find(
      (child) => child.props.value === value
    );
    if (selectedOption) {
      updateSelectValue(selectedOption.props.value);
    }
  }, [value, children]);
  const handleOptionClick = (e: { value: string; children: ReactNode }) => {
    updateSelectValue(e.value);
    updateShowList(false);
    if (onChange) {
      onChange(e); // Safely invoke onChange
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
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  return (
    <div className="dropdown" ref={dropdownRef}>
      <div
        className="control"
        style={{ borderColor: showList ? '#007FD4' : undefined }}
        onClick={handleDropdownClick}
        id={id}
      >
        <div className="label">
          {contrastOptions.length > 0 &&
            contrastOptions.find((child) => child.props.value === selectedValue)
              ?.props.children}
        </div>
        <div>
          <i
            className="fa fa-angle-down"
            aria-hidden="true"
            style={{ fontSize: '20px' }}
          ></i>
        </div>
      </div>
      {showList && contrastOptions.length > 0 && (
        <div className="listBox">
          {Children.map(contrastOptions, (child) =>
            React.cloneElement(child, {
              onClick: handleOptionClick,
              style:
                child.props.value === selectedValue
                  ? {
                      background:
                        contrastTheme === 1 ? 'rgb(88 178 239)' : '#094771',
                      border: '1px solid #007FD4',
                    }
                  : {},
              id,
            })
          )}
        </div>
      )}
    </div>
  );
};
export { ContrastDropdown, ContrastOption };

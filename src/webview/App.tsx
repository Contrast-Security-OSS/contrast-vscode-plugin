import React from 'react';
import Setting from './screens/Setting/Setting';
import { useSelector } from 'react-redux';
import { ContrastScan } from './screens/Scan/Scan';
import { ReducerTypes } from '../common/types';
import { ContrastAssess } from './screens/Assess/Assess';

function App() {
  const screenView = useSelector((state: ReducerTypes) => state.screen.data);
  const contrastTheme = useSelector((state: ReducerTypes) => state.theme.data);

  return (
    <div className={contrastTheme === 1 ? 'root-div-light' : 'root-div-dark'}>
      {screenView === 1 ? <Setting /> : null}
      {screenView === 2 ? <ContrastScan /> : null}
      {screenView === 3 ? <ContrastAssess /> : null}
    </div>
  );
}

export default App;

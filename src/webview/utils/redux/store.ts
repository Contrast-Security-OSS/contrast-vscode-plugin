import { configureStore } from '@reduxjs/toolkit';
import { LocaleReducer } from './slices/localeSlice';
import { ScreenReducer } from './slices/screenSlice';
import { ProjectReducer } from './slices/projectsSlice';
import { vulnerabilityReducer } from './slices/vulReport';
import { ScanReducer } from './slices/ScanFilter';
import { ThemeReducer } from './slices/contrastTheme';
export const ContrastStore = configureStore({
  reducer: {
    i10ln: LocaleReducer,
    screen: ScreenReducer,
    project: ProjectReducer,
    vulnerability: vulnerabilityReducer,
    scan: ScanReducer,
    theme: ThemeReducer,
  },
});
export default ContrastStore;
export type RootState = ReturnType<typeof ContrastStore.getState>;
export type AppDispatch = typeof ContrastStore.dispatch;
